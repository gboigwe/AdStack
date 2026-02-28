import Redis from 'ioredis';
import { createLogger } from '../../monitoring/logging/logger';
import { cacheHitsTotal, cacheMissesTotal } from '../../monitoring/prometheus/metrics';

const logger = createLogger({ service: 'cache' });

interface CacheConfig {
  redisUrl: string;
  defaultTtl: number;
  keyPrefix: string;
}

const TTL_PRESETS = {
  campaign_list: 300,
  campaign_detail: 600,
  subscription_status: 1800,
  analytics_overview: 120,
  user_profile: 900,
  contract_read: 60,
  publisher_list: 600,
  static_data: 3600,
} as const;

export class CacheService {
  private client: Redis;
  private config: CacheConfig;
  private connected: boolean = false;

  constructor(config: CacheConfig) {
    this.config = config;
    this.client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      lazyConnect: true,
    });

    this.client.on('connect', () => {
      this.connected = true;
      logger.info('Redis cache connected');
    });

    this.client.on('error', (err) => {
      logger.error('Redis cache error', { error: err.message });
    });

    this.client.on('close', () => {
      this.connected = false;
      logger.warn('Redis cache connection closed');
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (err) {
      logger.error('Failed to connect to Redis', { error: (err as Error).message });
    }
  }

  private key(name: string): string {
    return `${this.config.keyPrefix}:${name}`;
  }

  async get<T>(cacheKey: string): Promise<T | null> {
    if (!this.connected) return null;

    try {
      const data = await this.client.get(this.key(cacheKey));
      if (data) {
        cacheHitsTotal.inc({ operation: cacheKey.split(':')[0] });
        return JSON.parse(data);
      }
      cacheMissesTotal.inc({ operation: cacheKey.split(':')[0] });
      return null;
    } catch (err) {
      logger.error('Cache get failed', { key: cacheKey, error: (err as Error).message });
      return null;
    }
  }

  async set(cacheKey: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.connected) return;

    try {
      const ttl = ttlSeconds || this.config.defaultTtl;
      const serialized = JSON.stringify(value);
      await this.client.setex(this.key(cacheKey), ttl, serialized);
    } catch (err) {
      logger.error('Cache set failed', { key: cacheKey, error: (err as Error).message });
    }
  }

  async invalidate(pattern: string): Promise<number> {
    if (!this.connected) return 0;

    try {
      const keys = await this.client.keys(this.key(pattern));
      if (keys.length === 0) return 0;
      const deleted = await this.client.del(...keys);
      logger.info('Cache invalidated', { pattern, keysDeleted: deleted });
      return deleted;
    } catch (err) {
      logger.error('Cache invalidation failed', { pattern, error: (err as Error).message });
      return 0;
    }
  }

  async getOrSet<T>(cacheKey: string, fetcher: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.get<T>(cacheKey);
    if (cached !== null) return cached;

    const result = await fetcher();
    await this.set(cacheKey, result, ttlSeconds);
    return result;
  }

  async invalidateOnWrite(entity: string, entityId?: string): Promise<void> {
    const patterns: string[] = [];

    switch (entity) {
      case 'campaign':
        patterns.push('campaign_list:*');
        if (entityId) patterns.push(`campaign_detail:${entityId}`);
        patterns.push('analytics_overview:*');
        break;
      case 'subscription':
        if (entityId) patterns.push(`subscription_status:${entityId}`);
        break;
      case 'user':
        if (entityId) patterns.push(`user_profile:${entityId}`);
        break;
      case 'publisher':
        patterns.push('publisher_list:*');
        break;
    }

    for (const pattern of patterns) {
      await this.invalidate(pattern);
    }
  }

  async getClient(): Promise<Redis> {
    return this.client;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    this.connected = false;
    logger.info('Redis cache disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export { TTL_PRESETS };
