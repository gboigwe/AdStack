/**
 * Request deduplication cache.
 *
 * When multiple components mount simultaneously and trigger the same
 * API call, this cache returns the in-flight promise instead of
 * sending a duplicate request. Entries are evicted once the promise
 * settles (plus a short grace window).
 */

interface CacheEntry<T> {
  promise: Promise<T>;
  timestamp: number;
}

/** Deduplication window — requests within this period share a promise. */
const DEDUP_WINDOW_MS = 200;

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Return a cached promise if one exists for the same key within the
 * dedup window, otherwise call the fetcher and cache its promise.
 */
export function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const existing = cache.get(key);
  if (existing && Date.now() - existing.timestamp < DEDUP_WINDOW_MS) {
    return existing.promise as Promise<T>;
  }

  const promise = fetcher().finally(() => {
    // Clean up after the promise settles + grace period
    setTimeout(() => {
      const entry = cache.get(key);
      if (entry && entry.promise === promise) {
        cache.delete(key);
      }
    }, DEDUP_WINDOW_MS);
  });

  cache.set(key, { promise, timestamp: Date.now() });
  return promise;
}
