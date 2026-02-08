import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';

export interface CachedEvent {
  id: string;
  type: string;
  contractId: string;
  txId: string;
  data: any;
  timestamp: number;
}

export interface CachedStats {
  totalEvents: number;
  eventsByType: Record<string, number>;
  lastUpdated: number;
}

export class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private defaultTTL: number;

  constructor() {
    this.defaultTTL = parseInt(process.env.REDIS_TTL || '3600', 10);
  }

  async connect(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.maxReconnectAttempts) {
              logger.error('Max Redis reconnection attempts reached');
              return new Error('Max reconnection attempts exceeded');
            }
            const delay = Math.min(retries * 100, 3000);
            logger.info(`Reconnecting to Redis in ${delay}ms...`);
            return delay;
          },
        },
      });

      this.client.on('error', (err) => {
        logger.error(`Redis error: ${err.message}`);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connecting...');
      });

      this.client.on('ready', () => {
        logger.info('Redis connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.client.on('reconnecting', () => {
        this.reconnectAttempts++;
        logger.warn(`Redis reconnecting... (attempt ${this.reconnectAttempts})`);
      });

      this.client.on('end', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error(`Failed to connect to Redis: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Cache event with TTL
  async cacheEvent(event: CachedEvent, ttl?: number): Promise<void> {
    if (!this.isReady()) {
      logger.warn('Redis not ready, skipping cache operation');
      return;
    }

    try {
      const key = `event:${event.contractId}:${event.id}`;
      const value = JSON.stringify(event);
      const expiry = ttl || this.defaultTTL;

      await this.client!.setEx(key, expiry, value);

      // Add to contract event list
      await this.client!.lPush(`events:${event.contractId}`, event.id);
      await this.client!.expire(`events:${event.contractId}`, expiry);

      // Add to type-specific list
      await this.client!.lPush(`events:type:${event.type}`, event.id);
      await this.client!.expire(`events:type:${event.type}`, expiry);

      logger.debug(`Cached event ${event.id} for contract ${event.contractId}`);
    } catch (error) {
      logger.error(`Failed to cache event: ${error}`);
    }
  }

  // Get event by ID
  async getEvent(contractId: string, eventId: string): Promise<CachedEvent | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      const key = `event:${contractId}:${eventId}`;
      const value = await this.client!.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as CachedEvent;
    } catch (error) {
      logger.error(`Failed to get event: ${error}`);
      return null;
    }
  }

  // Get event history for a contract
  async getEventHistory(contractId: string, limit: number = 50): Promise<CachedEvent[]> {
    if (!this.isReady()) {
      return [];
    }

    try {
      const eventIds = await this.client!.lRange(`events:${contractId}`, 0, limit - 1);
      const events: CachedEvent[] = [];

      for (const eventId of eventIds) {
        const event = await this.getEvent(contractId, eventId);
        if (event) {
          events.push(event);
        }
      }

      return events;
    } catch (error) {
      logger.error(`Failed to get event history: ${error}`);
      return [];
    }
  }

  // Get events by type
  async getEventsByType(type: string, limit: number = 50): Promise<CachedEvent[]> {
    if (!this.isReady()) {
      return [];
    }

    try {
      const eventIds = await this.client!.lRange(`events:type:${type}`, 0, limit - 1);
      const events: CachedEvent[] = [];

      for (const eventId of eventIds) {
        // Extract contract ID from event data (we'll need to fetch each event)
        const allKeys = await this.client!.keys(`event:*:${eventId}`);
        for (const key of allKeys) {
          const value = await this.client!.get(key);
          if (value) {
            events.push(JSON.parse(value));
            break;
          }
        }
      }

      return events;
    } catch (error) {
      logger.error(`Failed to get events by type: ${error}`);
      return [];
    }
  }

  // Cache statistics
  async cacheStats(contractId: string, stats: CachedStats, ttl?: number): Promise<void> {
    if (!this.isReady()) {
      return;
    }

    try {
      const key = `stats:${contractId}`;
      const value = JSON.stringify(stats);
      const expiry = ttl || 300; // Default 5 minutes for stats

      await this.client!.setEx(key, expiry, value);
      logger.debug(`Cached stats for contract ${contractId}`);
    } catch (error) {
      logger.error(`Failed to cache stats: ${error}`);
    }
  }

  // Get cached statistics
  async getStats(contractId: string): Promise<CachedStats | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      const key = `stats:${contractId}`;
      const value = await this.client!.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as CachedStats;
    } catch (error) {
      logger.error(`Failed to get stats: ${error}`);
      return null;
    }
  }

  // Increment counter
  async incrementCounter(key: string, ttl?: number): Promise<number> {
    if (!this.isReady()) {
      return 0;
    }

    try {
      const count = await this.client!.incr(key);

      if (ttl) {
        await this.client!.expire(key, ttl);
      }

      return count;
    } catch (error) {
      logger.error(`Failed to increment counter: ${error}`);
      return 0;
    }
  }

  // Get counter value
  async getCounter(key: string): Promise<number> {
    if (!this.isReady()) {
      return 0;
    }

    try {
      const value = await this.client!.get(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      logger.error(`Failed to get counter: ${error}`);
      return 0;
    }
  }

  // Set with TTL
  async setWithTTL(key: string, value: string, ttl: number): Promise<void> {
    if (!this.isReady()) {
      return;
    }

    try {
      await this.client!.setEx(key, ttl, value);
    } catch (error) {
      logger.error(`Failed to set value with TTL: ${error}`);
    }
  }

  // Get value
  async get(key: string): Promise<string | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      return await this.client!.get(key);
    } catch (error) {
      logger.error(`Failed to get value: ${error}`);
      return null;
    }
  }

  // Delete key
  async delete(key: string): Promise<void> {
    if (!this.isReady()) {
      return;
    }

    try {
      await this.client!.del(key);
    } catch (error) {
      logger.error(`Failed to delete key: ${error}`);
    }
  }

  // Clear all events (useful for testing)
  async clearEvents(): Promise<void> {
    if (!this.isReady()) {
      return;
    }

    try {
      const keys = await this.client!.keys('event:*');
      if (keys.length > 0) {
        await this.client!.del(keys);
      }

      const listKeys = await this.client!.keys('events:*');
      if (listKeys.length > 0) {
        await this.client!.del(listKeys);
      }

      logger.info('Cleared all cached events');
    } catch (error) {
      logger.error(`Failed to clear events: ${error}`);
    }
  }
}

export default new RedisService();
