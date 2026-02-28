import app from './app';
import { config } from './config/config';
import { testConnection, closePool } from './lib/database';
import { connectRedis, closeRedis } from './lib/cache';
import { logger } from './lib/logger';
import { startScheduler, stopScheduler } from './services/scheduler';

const PORT = config.app.port;

async function start() {
  logger.info('Starting AdStack API server...');

  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.error('Failed to connect to database. Exiting.');
    process.exit(1);
  }

  const redisConnected = await connectRedis();
  if (!redisConnected) {
    logger.warn('Redis connection failed. Cache features will be unavailable.');
  }

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${config.app.env}`);
    logger.info(`API URL: ${config.app.apiUrl}`);
  });

  if (config.app.env !== 'test') {
    startScheduler();
  }

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
      logger.info('HTTP server closed');

      stopScheduler();
      await closePool();
      await closeRedis();

      logger.info('All connections closed. Exiting.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
  });
}

start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
