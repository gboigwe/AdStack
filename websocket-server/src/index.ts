import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './utils/logger';
import { authMiddleware } from './middleware/auth';
import redisService from './services/redis';
import stacksEventsService from './services/stacksEvents';
import websocketService from './services/websocket';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      redis: redisService.isReady(),
      stacksWebSocket: stacksEventsService.isConnected(),
      websocket: websocketService.getConnectedClientsCount(),
    },
    metrics: {
      connectedClients: websocketService.getConnectedClientsCount(),
      activeSubscriptions: websocketService.getSubscriptionCount(),
      memoryUsage: process.memoryUsage(),
    },
  };

  const statusCode = health.services.redis && health.services.stacksWebSocket ? 200 : 503;
  res.status(statusCode).json(health);
});

// Status endpoint (detailed)
app.get('/status', (req: Request, res: Response) => {
  const status = {
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: process.uptime(),
      formatted: formatUptime(process.uptime()),
    },
    services: {
      redis: {
        connected: redisService.isReady(),
        url: process.env.REDIS_URL?.replace(/:[^:]*@/, ':****@') || 'not configured',
      },
      stacksWebSocket: {
        connected: stacksEventsService.isConnected(),
        url: process.env.STACKS_WS_URL || 'not configured',
      },
      websocket: {
        connectedClients: websocketService.getConnectedClientsCount(),
        activeSubscriptions: websocketService.getSubscriptionCount(),
      },
    },
    contracts: {
      campaigns: process.env.CAMPAIGN_CONTRACT || 'not configured',
      auctions: process.env.AUCTION_CONTRACT || 'not configured',
      bridge: process.env.BRIDGE_CONTRACT || 'not configured',
      payments: process.env.PAYMENT_CONTRACT || 'not configured',
      governance: process.env.GOVERNANCE_CONTRACT || 'not configured',
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      },
    },
  };

  res.json(status);
});

// Metrics endpoint (Prometheus-style)
app.get('/metrics', (req: Request, res: Response) => {
  const metrics = [
    `# HELP adstack_connected_clients Number of connected WebSocket clients`,
    `# TYPE adstack_connected_clients gauge`,
    `adstack_connected_clients ${websocketService.getConnectedClientsCount()}`,
    ``,
    `# HELP adstack_active_subscriptions Number of active event subscriptions`,
    `# TYPE adstack_active_subscriptions gauge`,
    `adstack_active_subscriptions ${websocketService.getSubscriptionCount()}`,
    ``,
    `# HELP adstack_uptime_seconds Server uptime in seconds`,
    `# TYPE adstack_uptime_seconds counter`,
    `adstack_uptime_seconds ${Math.floor(process.uptime())}`,
    ``,
    `# HELP adstack_memory_usage_bytes Memory usage in bytes`,
    `# TYPE adstack_memory_usage_bytes gauge`,
    `adstack_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}`,
    `adstack_memory_usage_bytes{type="heap_total"} ${process.memoryUsage().heapTotal}`,
    `adstack_memory_usage_bytes{type="heap_used"} ${process.memoryUsage().heapUsed}`,
  ].join('\n');

  res.type('text/plain').send(metrics);
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  logger.error(`Unhandled error: ${err.message}`, err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// Initialize services
async function initializeServices(): Promise<void> {
  try {
    logger.info('Initializing services...');

    // Connect to Redis
    logger.info('Connecting to Redis...');
    await redisService.connect();
    logger.info('Redis connected successfully');

    // Initialize WebSocket service
    logger.info('Initializing WebSocket service...');
    websocketService.initialize(server);

    // Apply authentication middleware to Socket.io
    const io = websocketService.getIO();
    if (io) {
      io.use(authMiddleware);
      logger.info('WebSocket authentication middleware applied');
    }

    // Connect to Stacks blockchain WebSocket
    logger.info('Connecting to Stacks blockchain...');
    await stacksEventsService.connect();
    logger.info('Stacks WebSocket connected successfully');

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error(`Failed to initialize services: ${error}`);
    throw error;
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, starting graceful shutdown...`);

  try {
    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Disconnect services
    logger.info('Disconnecting services...');

    await stacksEventsService.disconnect();
    logger.info('Stacks WebSocket disconnected');

    await redisService.disconnect();
    logger.info('Redis disconnected');

    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${error}`);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

// Start server
const PORT = process.env.PORT || 3002;

async function start(): Promise<void> {
  try {
    // Initialize all services
    await initializeServices();

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`===========================================`);
      logger.info(`AdStack WebSocket Server`);
      logger.info(`===========================================`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Server listening on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Status: http://localhost:${PORT}/status`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`===========================================`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

// Start the application
start();
