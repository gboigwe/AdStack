// Simple in-memory cache with TTL for API results

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}
