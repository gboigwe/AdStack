// Simple in-memory cache with TTL for API results

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class SimpleCache<K, V> {
  private store = new Map<K, CacheEntry<V>>();
  constructor(private defaultTtlMs = 30_000) {}

  set(key: K, value: V, ttlMs = this.defaultTtlMs): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get(key: K): V | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { this.store.delete(key); return null; }
    return entry.value;
  }

  has(key: K): boolean { return this.get(key) !== null; }
  delete(key: K): void { this.store.delete(key); }
  clear(): void { this.store.clear(); }
  size(): number { return this.store.size; }
}

export function memoizeAsync<T>(
  fn: (...args: unknown[]) => Promise<T>,
  ttlMs = 30_000
): (...args: unknown[]) => Promise<T> {
  const cache = new SimpleCache<string, T>(ttlMs);
  return async (...args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    if (cached !== null) return cached;
    const result = await fn(...args);
    cache.set(key, result);
    return result;
  };
}
