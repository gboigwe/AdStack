type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate';

interface CacheConfig {
  strategy: CacheStrategy;
  maxAge: number;
  maxEntries: number;
}

const ROUTE_CONFIGS: Record<string, CacheConfig> = {
  '/api/campaigns': { strategy: 'network-first', maxAge: 5 * 60 * 1000, maxEntries: 30 },
  '/api/analytics': { strategy: 'network-first', maxAge: 2 * 60 * 1000, maxEntries: 20 },
  '/api/publishers': { strategy: 'stale-while-revalidate', maxAge: 10 * 60 * 1000, maxEntries: 20 },
  '/api/governance': { strategy: 'network-first', maxAge: 5 * 60 * 1000, maxEntries: 15 },
  '/api/notifications': { strategy: 'network-first', maxAge: 1 * 60 * 1000, maxEntries: 50 },
};

const DEFAULT_CONFIG: CacheConfig = {
  strategy: 'network-first',
  maxAge: 5 * 60 * 1000,
  maxEntries: 30,
};

export function getCacheConfig(pathname: string): CacheConfig {
  for (const [route, config] of Object.entries(ROUTE_CONFIGS)) {
    if (pathname.startsWith(route)) {
      return config;
    }
  }
  return DEFAULT_CONFIG;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function getFromMemoryCache<T>(key: string, maxAge: number): T | null {
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (Date.now() - entry.timestamp > maxAge) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data;
}

export function setInMemoryCache<T>(key: string, data: T, etag?: string): void {
  memoryCache.set(key, { data, timestamp: Date.now(), etag });

  if (memoryCache.size > 200) {
    const oldest = Array.from(memoryCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 50);
    for (const [k] of oldest) {
      memoryCache.delete(k);
    }
  }
}

export function invalidateMemoryCache(pattern?: string): void {
  if (!pattern) {
    memoryCache.clear();
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }
}

export async function cachedFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T; fromCache: boolean }> {
  const config = getCacheConfig(new URL(url, window.location.origin).pathname);

  const cached = getFromMemoryCache<T>(url, config.maxAge);
  if (cached && config.strategy === 'cache-first') {
    return { data: cached, fromCache: true };
  }

  if (cached && config.strategy === 'stale-while-revalidate') {
    fetchAndUpdate<T>(url, options).catch(() => {});
    return { data: cached, fromCache: true };
  }

  try {
    const data = await fetchAndUpdate<T>(url, options);
    return { data, fromCache: false };
  } catch {
    if (cached) {
      return { data: cached, fromCache: true };
    }
    throw new Error(`Failed to fetch ${url} and no cached data available`);
  }
}

async function fetchAndUpdate<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const etag = response.headers.get('etag') || undefined;
  setInMemoryCache(url, data, etag);
  return data as T;
}

export function getCacheStats(): { entries: number; routes: string[] } {
  return {
    entries: memoryCache.size,
    routes: Object.keys(ROUTE_CONFIGS),
  };
}
