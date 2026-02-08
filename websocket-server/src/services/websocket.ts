import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from '../utils/logger';
import redisService, { CachedEvent } from './redis';
import stacksEventsService, { ParsedEvent } from './stacksEvents';
import { AuthenticatedSocket } from '../middleware/auth';

export interface SubscriptionInfo {
  socketId: string;
  userId: string;
  contractId: string;
  eventTypes: string[];
  subscribedAt: number;
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private subscriptions: Map<string, SubscriptionInfo> = new Map();
  private maxSubscriptionsPerClient: number;
  private eventHistoryLimit: number;

  constructor() {
    this.maxSubscriptionsPerClient = parseInt(
      process.env.MAX_SUBSCRIPTIONS_PER_CLIENT || '10',
      10
    );
    this.eventHistoryLimit = parseInt(
      process.env.EVENT_HISTORY_LIMIT || '100',
      10
    );
  }

  initialize(server: HttpServer): void {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

    this.io = new SocketIOServer(server, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    logger.info('WebSocket service initialized');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.io) {
      logger.error('Socket.IO not initialized');
      return;
    }

    // Listen to Stacks events and forward to Socket.io
    stacksEventsService.on('event', (event: ParsedEvent) => {
      this.handleStacksEvent(event);
    });

    stacksEventsService.on('block', (block: any) => {
      this.io!.emit('block', block);
    });

    stacksEventsService.on('transaction', (tx: any) => {
      this.io!.emit('transaction', tx);
    });

    // Handle Socket.io connections
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });

    logger.info('Event listeners setup complete');
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId || 'anonymous';
    const address = socket.address || 'unknown';

    logger.info(`Client connected: ${socket.id} (User: ${userId}, Address: ${address})`);

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to AdStack real-time analytics',
      socketId: socket.id,
      userId,
      timestamp: Date.now(),
    });

    // Handle subscription requests
    socket.on('subscribe', async (data: { contractId: string; eventTypes?: string[] }) => {
      await this.handleSubscribe(socket, data);
    });

    // Handle unsubscribe requests
    socket.on('unsubscribe', (data: { contractId: string }) => {
      this.handleUnsubscribe(socket, data.contractId);
    });

    // Handle history requests
    socket.on('getHistory', async (data: { contractId: string; limit?: number }) => {
      await this.handleGetHistory(socket, data);
    });

    // Handle stats requests
    socket.on('getStats', async (data: { contractId: string }) => {
      await this.handleGetStats(socket, data.contractId);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id} (Reason: ${reason})`);
      this.handleDisconnect(socket);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}: ${error}`);
    });
  }

  private async handleSubscribe(
    socket: AuthenticatedSocket,
    data: { contractId: string; eventTypes?: string[] }
  ): Promise<void> {
    const { contractId, eventTypes = [] } = data;
    const userId = socket.userId || 'anonymous';

    // Check subscription limit
    const userSubscriptions = Array.from(this.subscriptions.values()).filter(
      (sub) => sub.userId === userId
    );

    if (userSubscriptions.length >= this.maxSubscriptionsPerClient) {
      socket.emit('error', {
        message: 'Maximum subscriptions limit reached',
        code: 'MAX_SUBSCRIPTIONS',
      });
      logger.warn(`User ${userId} exceeded subscription limit`);
      return;
    }

    // Create subscription
    const subscriptionKey = `${socket.id}:${contractId}`;
    const subscription: SubscriptionInfo = {
      socketId: socket.id,
      userId,
      contractId,
      eventTypes,
      subscribedAt: Date.now(),
    };

    this.subscriptions.set(subscriptionKey, subscription);

    // Join Socket.io room for this contract
    socket.join(`contract:${contractId}`);

    // If specific event types requested, join those rooms too
    if (eventTypes.length > 0) {
      eventTypes.forEach((type) => {
        socket.join(`event:${type}`);
      });
    }

    logger.info(
      `User ${userId} subscribed to contract ${contractId} (Types: ${eventTypes.join(', ') || 'all'})`
    );

    socket.emit('subscribed', {
      contractId,
      eventTypes,
      timestamp: Date.now(),
    });

    // Send recent events from cache
    try {
      const recentEvents = await redisService.getEventHistory(contractId, 10);
      if (recentEvents.length > 0) {
        socket.emit('history', {
          contractId,
          events: recentEvents,
          count: recentEvents.length,
        });
      }
    } catch (error) {
      logger.error(`Failed to send recent events: ${error}`);
    }
  }

  private handleUnsubscribe(socket: AuthenticatedSocket, contractId: string): void {
    const subscriptionKey = `${socket.id}:${contractId}`;
    const subscription = this.subscriptions.get(subscriptionKey);

    if (!subscription) {
      socket.emit('error', {
        message: 'Subscription not found',
        code: 'NOT_SUBSCRIBED',
      });
      return;
    }

    // Leave rooms
    socket.leave(`contract:${contractId}`);
    subscription.eventTypes.forEach((type) => {
      socket.leave(`event:${type}`);
    });

    this.subscriptions.delete(subscriptionKey);

    logger.info(`User ${subscription.userId} unsubscribed from contract ${contractId}`);

    socket.emit('unsubscribed', {
      contractId,
      timestamp: Date.now(),
    });
  }

  private async handleGetHistory(
    socket: AuthenticatedSocket,
    data: { contractId: string; limit?: number }
  ): Promise<void> {
    const { contractId, limit = 50 } = data;
    const actualLimit = Math.min(limit, this.eventHistoryLimit);

    try {
      // Try to get from cache first
      let events = await redisService.getEventHistory(contractId, actualLimit);

      // If not enough events in cache, fetch from Stacks API
      if (events.length < actualLimit) {
        const historicalEvents = await stacksEventsService.fetchHistoricalEvents(
          contractId,
          actualLimit
        );

        // Merge with cached events
        const eventIds = new Set(events.map((e) => e.id));
        const newEvents = historicalEvents.filter((e) => !eventIds.has(e.id));
        events = [...events, ...newEvents].slice(0, actualLimit);
      }

      socket.emit('history', {
        contractId,
        events,
        count: events.length,
        limit: actualLimit,
      });

      logger.debug(`Sent ${events.length} historical events to ${socket.id}`);
    } catch (error) {
      logger.error(`Failed to get history: ${error}`);
      socket.emit('error', {
        message: 'Failed to retrieve event history',
        code: 'HISTORY_ERROR',
      });
    }
  }

  private async handleGetStats(socket: AuthenticatedSocket, contractId: string): Promise<void> {
    try {
      // Try to get from cache
      let stats = await redisService.getStats(contractId);

      if (!stats) {
        // Calculate stats from recent events
        const events = await redisService.getEventHistory(contractId, this.eventHistoryLimit);
        const eventsByType: Record<string, number> = {};

        events.forEach((event) => {
          eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
        });

        stats = {
          totalEvents: events.length,
          eventsByType,
          lastUpdated: Date.now(),
        };

        // Cache the stats
        await redisService.cacheStats(contractId, stats);
      }

      socket.emit('stats', {
        contractId,
        stats,
      });

      logger.debug(`Sent stats for ${contractId} to ${socket.id}`);
    } catch (error) {
      logger.error(`Failed to get stats: ${error}`);
      socket.emit('error', {
        message: 'Failed to retrieve statistics',
        code: 'STATS_ERROR',
      });
    }
  }

  private handleDisconnect(socket: AuthenticatedSocket): void {
    // Remove all subscriptions for this socket
    const socketSubscriptions = Array.from(this.subscriptions.entries()).filter(
      ([key]) => key.startsWith(socket.id)
    );

    socketSubscriptions.forEach(([key, sub]) => {
      socket.leave(`contract:${sub.contractId}`);
      sub.eventTypes.forEach((type) => {
        socket.leave(`event:${type}`);
      });
      this.subscriptions.delete(key);
    });

    logger.info(`Cleaned up ${socketSubscriptions.length} subscriptions for ${socket.id}`);
  }

  private async handleStacksEvent(event: ParsedEvent): Promise<void> {
    if (!this.io) {
      return;
    }

    // Cache the event
    const cachedEvent: CachedEvent = {
      id: event.id,
      type: event.type,
      contractId: event.contractId,
      txId: event.txId,
      data: event.data,
      timestamp: event.timestamp,
    };

    await redisService.cacheEvent(cachedEvent);

    // Emit to all clients subscribed to this contract
    this.io.to(`contract:${event.contractId}`).emit('event', event);

    // Emit to all clients subscribed to this event type
    this.io.to(`event:${event.type}`).emit('event', event);

    // Broadcast to all connected clients (for global feed)
    this.io.emit('global_event', {
      contractId: event.contractId,
      type: event.type,
      timestamp: event.timestamp,
    });

    logger.debug(`Broadcasted event ${event.id} to subscribed clients`);

    // Update statistics
    await this.updateStats(event.contractId, event.type);
  }

  private async updateStats(contractId: string, eventType: string): Promise<void> {
    try {
      let stats = await redisService.getStats(contractId);

      if (!stats) {
        stats = {
          totalEvents: 0,
          eventsByType: {},
          lastUpdated: Date.now(),
        };
      }

      stats.totalEvents++;
      stats.eventsByType[eventType] = (stats.eventsByType[eventType] || 0) + 1;
      stats.lastUpdated = Date.now();

      await redisService.cacheStats(contractId, stats);
    } catch (error) {
      logger.error(`Failed to update stats: ${error}`);
    }
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  getConnectedClientsCount(): number {
    if (!this.io) {
      return 0;
    }
    return this.io.engine.clientsCount;
  }
}

export default new WebSocketService();
