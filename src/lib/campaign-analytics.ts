/**
 * Campaign Analytics Helpers
 *
 * Pure functions for computing campaign performance metrics.
 * These operate on raw on-chain and API data and return derived
 * stats for display in dashboards and detail pages.
 */

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  spent: bigint; // micro-STX
  budget: bigint; // micro-STX
}

export interface CampaignPerformance {
  /** Click-through rate (0-1) */
  ctr: number;
  /** Cost per click in micro-STX (0 if no clicks) */
  cpc: bigint;
  /** Cost per mille (thousand impressions) in micro-STX */
  cpm: bigint;
  /** Budget utilisation (0-1) */
  budgetUsed: number;
  /** Budget remaining in micro-STX */
  budgetRemaining: bigint;
}

/**
 * Compute derived performance metrics from raw campaign data.
 */
export function computePerformance(metrics: CampaignMetrics): CampaignPerformance {
  const { impressions, clicks, spent, budget } = metrics;

  const ctr = impressions > 0 ? clicks / impressions : 0;

  const cpc = clicks > 0 ? spent / BigInt(clicks) : 0n;

  const cpm = impressions > 0
    ? (spent * 1000n) / BigInt(impressions)
    : 0n;

  const budgetUsed = budget > 0n
    ? Number(spent) / Number(budget)
    : 0;

  const budgetRemaining = budget > spent ? budget - spent : 0n;

  return { ctr, cpc, cpm, budgetUsed, budgetRemaining };
}

/**
 * Estimate remaining campaign duration in blocks based on current spend rate.
 * Returns null if the campaign has no spending yet (cannot estimate).
 *
 * @param elapsedBlocks — number of blocks since campaign start
 */
export function estimateRemainingBlocks(
  metrics: CampaignMetrics,
  elapsedBlocks: number,
): number | null {
  if (elapsedBlocks <= 0 || metrics.spent <= 0n) return null;

  const remaining = metrics.budget > metrics.spent
    ? metrics.budget - metrics.spent
    : 0n;

  if (remaining === 0n) return 0;

  // Rate = spent / elapsed, remaining blocks = remaining / rate
  // Use scaled integer math to avoid float precision issues
  const scaledRate = (metrics.spent * 10000n) / BigInt(elapsedBlocks);
  if (scaledRate === 0n) return null;

  return Number((remaining * 10000n) / scaledRate);
}

/**
 * Bucket impression data into daily totals for charting.
 * Takes an array of {timestamp, count} entries and groups by UTC date.
 *
 * @returns Array of {date: 'YYYY-MM-DD', total: number} sorted chronologically
 */
export function bucketByDay(
  entries: ReadonlyArray<{ timestamp: number; count: number }>,
): Array<{ date: string; total: number }> {
  const buckets = new Map<string, number>();

  for (const entry of entries) {
    const d = new Date(entry.timestamp * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + entry.count);
  }

  return Array.from(buckets.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Compute a moving average over daily totals.
 *
 * @param data — output from bucketByDay
 * @param window — number of days to average (default 7)
 */
export function movingAverage(
  data: ReadonlyArray<{ date: string; total: number }>,
  window = 7,
): Array<{ date: string; average: number }> {
  return data.map((point, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const sum = slice.reduce((acc, d) => acc + d.total, 0);
    return { date: point.date, average: sum / slice.length };
  });
}
