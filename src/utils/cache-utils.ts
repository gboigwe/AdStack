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
