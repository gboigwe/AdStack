/**
 * React Query Configuration
 *
 * Centralised stale-time and cache-time presets for different data
 * categories.  Import these in hooks to override the global defaults
 * when a query needs tighter or looser freshness guarantees.
 */

/** Stale times in milliseconds */
export const STALE_TIMES = {
  /** Block height, mempool — changes every ~10 minutes */
  BLOCK: 10_000,
  /** Wallet balance — check fairly often */
  BALANCE: 15_000,
  /** Campaign data — moderate refresh */
  CAMPAIGN: 30_000,
  /** Governance proposals — slow-moving */
  GOVERNANCE: 60_000,
  /** User profile, registration status — rarely changes */
  PROFILE: 120_000,
  /** Static reference data (contract addresses, etc.) */
  STATIC: 300_000,
} as const;

/** Garbage collection times — how long inactive queries stay in cache */
export const GC_TIMES = {
  /** Short-lived queries dropped after 2 minutes idle */
  SHORT: 2 * 60 * 1000,
  /** Standard queries cached for 5 minutes after last subscriber */
  STANDARD: 5 * 60 * 1000,
  /** Long-lived reference data cached for 15 minutes */
  LONG: 15 * 60 * 1000,
} as const;

/** Retry configuration for different failure modes */
export const RETRY_CONFIG = {
  /** API calls — retry up to 2 times with exponential backoff */
  API: {
    retry: 2,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 10_000),
  },
  /** Contract reads — retry once */
  CONTRACT: {
    retry: 1,
    retryDelay: () => 2_000,
  },
  /** No retries */
  NONE: {
    retry: 0,
  },
} as const;

/** Refetch interval for live-updating queries (polling) */
export const REFETCH_INTERVALS = {
  /** Mempool transactions — every 15 seconds */
  MEMPOOL: 15_000,
  /** Campaign count — every 60 seconds */
  CAMPAIGN_COUNT: 60_000,
  /** Block height — every 30 seconds */
  BLOCK_HEIGHT: 30_000,
} as const;
