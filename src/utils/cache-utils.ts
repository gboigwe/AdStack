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
