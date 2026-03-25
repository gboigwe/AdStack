/**
 * block-time-cache.ts
 * Cache mapping Stacks block heights to their block-time timestamps.
 * Avoids repeated API calls when converting historical block heights
 * to Unix timestamps for display.
 */

import { getApiUrl, SupportedNetwork } from './stacks-network';

// ---------------------------------------------------------------------------
// In-Memory LRU-like Cache
// ---------------------------------------------------------------------------

const MAX_CACHE_SIZE = 500;
const blockTimeCache = new Map<number, number>();

/**
 * Evict oldest entries if the cache exceeds capacity.
 */
function evictIfNeeded(): void {
  if (blockTimeCache.size >= MAX_CACHE_SIZE) {
    const firstKey = blockTimeCache.keys().next().value;
    if (firstKey !== undefined) {
      blockTimeCache.delete(firstKey);
    }
  }
}

// ---------------------------------------------------------------------------
// Block Time Fetching
// ---------------------------------------------------------------------------

/**
 * Fetch the Unix timestamp for a specific Stacks block height.
 * Results are cached to avoid repeated API calls.
 */
export async function fetchBlockTime(
  height: number,
  network?: SupportedNetwork,
): Promise<number> {
  if (blockTimeCache.has(height)) {
    return blockTimeCache.get(height)!;
  }

  const apiUrl = getApiUrl(network);
  const response = await fetch(`${apiUrl}/extended/v2/blocks/${height}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch block ${height}: ${response.statusText}`);
  }

  const data = await response.json();
  const blockTime: number = data.block_time ?? data.burn_block_time ?? 0;

  evictIfNeeded();
  blockTimeCache.set(height, blockTime);

  return blockTime;
}

/**
 * Fetch block times for multiple heights in parallel.
 * Returns a map of height -> Unix timestamp.
 */
export async function fetchBlockTimes(
  heights: number[],
  network?: SupportedNetwork,
): Promise<Map<number, number>> {
  const uncached = heights.filter((h) => !blockTimeCache.has(h));

  if (uncached.length > 0) {
    await Promise.allSettled(
      uncached.map((h) => fetchBlockTime(h, network)),
    );
  }

  const result = new Map<number, number>();
  for (const height of heights) {
    const time = blockTimeCache.get(height);
    if (time !== undefined) result.set(height, time);
  }

  return result;
}

/**
 * Convert a block height to a JavaScript Date.
 * Fetches the block time from the Hiro API.
 */
export async function blockHeightToDate(
  height: number,
  network?: SupportedNetwork,
): Promise<Date> {
  const ts = await fetchBlockTime(height, network);
  return new Date(ts * 1000);
}

/**
 * Pre-populate the cache with known block heights.
 * Useful for seeding the cache from indexed event data.
 */
export function seedBlockTimeCache(entries: Array<[number, number]>): void {
  for (const [height, time] of entries) {
    evictIfNeeded();
    blockTimeCache.set(height, time);
  }
}

/**
 * Clear the block time cache.
 */
export function clearBlockTimeCache(): void {
  blockTimeCache.clear();
}
