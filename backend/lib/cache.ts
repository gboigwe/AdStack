import Redis from 'ioredis';
import { config } from '../config/config';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const cacheConfig = config.cache;
    const url = cacheConfig?.url || 'redis://localhost:6379';

    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 10) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });

    redis.on('connect', () => {
      console.log('Redis connected');
    });
  }

  return redis;
}

export async function connectRedis(): Promise<boolean> {
  try {
    const client = getRedis();
    await client.connect();
    return true;
  } catch (error) {
    console.error('Redis connection failed:', (error as Error).message);
    return false;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedis();
    const value = await client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = 3600
): Promise<boolean> {
  try {
    const client = getRedis();
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    return true;
  } catch {
    return false;
  }
}

export async function cacheDelete(key: string): Promise<boolean> {
  try {
    const client = getRedis();
    await client.del(key);
    return true;
  } catch {
    return false;
  }
}

export async function cacheDeletePattern(pattern: string): Promise<number> {
  try {
    const client = getRedis();
    const keys = await client.keys(pattern);
    if (keys.length === 0) return 0;
    return await client.del(...keys);
  } catch {
    return 0;
  }
}

export async function cacheIncrement(key: string, amount: number = 1): Promise<number> {
  const client = getRedis();
  return client.incrby(key, amount);
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('Redis connection closed');
  }
}

export const cache = {
  get: cacheGet,
  set: cacheSet,
  delete: cacheDelete,
  deletePattern: cacheDeletePattern,
  increment: cacheIncrement,
  getClient: getRedis,
  connect: connectRedis,
  close: closeRedis,
};
