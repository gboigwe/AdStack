import { describe, it, expect } from 'vitest';
import {
  computePerformance,
  estimateRemainingBlocks,
  bucketByDay,
  movingAverage,
  type CampaignMetrics,
} from '@/lib/campaign-analytics';

describe('computePerformance', () => {
  it('computes CTR correctly', () => {
    const m: CampaignMetrics = { impressions: 1000, clicks: 50, spent: 500_000n, budget: 1_000_000n };
    const result = computePerformance(m);
    expect(result.ctr).toBeCloseTo(0.05);
  });

  it('returns 0 CTR when no impressions', () => {
    const m: CampaignMetrics = { impressions: 0, clicks: 0, spent: 0n, budget: 1_000_000n };
    expect(computePerformance(m).ctr).toBe(0);
  });

  it('computes CPC as spent / clicks', () => {
    const m: CampaignMetrics = { impressions: 500, clicks: 10, spent: 100_000n, budget: 1_000_000n };
    expect(computePerformance(m).cpc).toBe(10_000n);
  });

  it('returns 0 CPC when no clicks', () => {
    const m: CampaignMetrics = { impressions: 100, clicks: 0, spent: 0n, budget: 1_000_000n };
    expect(computePerformance(m).cpc).toBe(0n);
  });

  it('computes CPM as (spent * 1000) / impressions', () => {
    const m: CampaignMetrics = { impressions: 2000, clicks: 100, spent: 200_000n, budget: 1_000_000n };
    expect(computePerformance(m).cpm).toBe(100_000n);
  });

  it('computes budget utilisation', () => {
    const m: CampaignMetrics = { impressions: 100, clicks: 10, spent: 250_000n, budget: 1_000_000n };
    expect(computePerformance(m).budgetUsed).toBeCloseTo(0.25);
  });

  it('computes budget remaining', () => {
    const m: CampaignMetrics = { impressions: 100, clicks: 10, spent: 750_000n, budget: 1_000_000n };
    expect(computePerformance(m).budgetRemaining).toBe(250_000n);
  });

  it('caps budget remaining at 0 when overspent', () => {
    const m: CampaignMetrics = { impressions: 100, clicks: 10, spent: 1_200_000n, budget: 1_000_000n };
    expect(computePerformance(m).budgetRemaining).toBe(0n);
  });
});

describe('estimateRemainingBlocks', () => {
  it('estimates blocks proportionally to spend rate', () => {
    const m: CampaignMetrics = { impressions: 100, clicks: 10, spent: 500_000n, budget: 1_000_000n };
    const result = estimateRemainingBlocks(m, 100);
    expect(result).toBe(100); // same rate = same blocks remaining
  });

  it('returns null when no blocks elapsed', () => {
    const m: CampaignMetrics = { impressions: 0, clicks: 0, spent: 0n, budget: 1_000_000n };
    expect(estimateRemainingBlocks(m, 0)).toBeNull();
  });

  it('returns null when nothing spent yet', () => {
    const m: CampaignMetrics = { impressions: 0, clicks: 0, spent: 0n, budget: 1_000_000n };
    expect(estimateRemainingBlocks(m, 50)).toBeNull();
  });

  it('returns 0 when budget is fully spent', () => {
    const m: CampaignMetrics = { impressions: 100, clicks: 10, spent: 1_000_000n, budget: 1_000_000n };
    expect(estimateRemainingBlocks(m, 100)).toBe(0);
  });
});

describe('bucketByDay', () => {
  it('groups entries by UTC date', () => {
    const entries = [
      { timestamp: 1709251200, count: 10 }, // 2024-03-01 00:00 UTC
      { timestamp: 1709265600, count: 5 },  // 2024-03-01 04:00 UTC
      { timestamp: 1709337600, count: 20 }, // 2024-03-02 00:00 UTC
    ];
    const result = bucketByDay(entries);
    expect(result).toEqual([
      { date: '2024-03-01', total: 15 },
      { date: '2024-03-02', total: 20 },
    ]);
  });

  it('returns empty array for no entries', () => {
    expect(bucketByDay([])).toEqual([]);
  });

  it('sorts results chronologically', () => {
    const entries = [
      { timestamp: 1709337600, count: 20 }, // March 2
      { timestamp: 1709251200, count: 10 }, // March 1
    ];
    const result = bucketByDay(entries);
    expect(result[0]?.date).toBe('2024-03-01');
    expect(result[1]?.date).toBe('2024-03-02');
  });
});

describe('movingAverage', () => {
  it('computes windowed average', () => {
    const data = [
      { date: '2024-03-01', total: 10 },
      { date: '2024-03-02', total: 20 },
      { date: '2024-03-03', total: 30 },
    ];
    const result = movingAverage(data, 3);
    expect(result[0]?.average).toBeCloseTo(10);      // just first point
    expect(result[1]?.average).toBeCloseTo(15);       // avg of 10, 20
    expect(result[2]?.average).toBeCloseTo(20);       // avg of 10, 20, 30
  });

  it('returns empty for empty input', () => {
    expect(movingAverage([], 7)).toEqual([]);
  });
});
