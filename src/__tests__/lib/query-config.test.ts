import { describe, it, expect } from 'vitest';
import {
  STALE_TIMES,
  GC_TIMES,
  RETRY_CONFIG,
  REFETCH_INTERVALS,
} from '@/lib/query-config';

describe('STALE_TIMES', () => {
  it('defines ascending stale times from fast to slow data', () => {
    expect(STALE_TIMES.BLOCK).toBeLessThan(STALE_TIMES.BALANCE);
    expect(STALE_TIMES.BALANCE).toBeLessThan(STALE_TIMES.CAMPAIGN);
    expect(STALE_TIMES.CAMPAIGN).toBeLessThan(STALE_TIMES.GOVERNANCE);
    expect(STALE_TIMES.GOVERNANCE).toBeLessThan(STALE_TIMES.PROFILE);
    expect(STALE_TIMES.PROFILE).toBeLessThan(STALE_TIMES.STATIC);
  });

  it('exports expected keys', () => {
    expect(STALE_TIMES).toHaveProperty('BLOCK');
    expect(STALE_TIMES).toHaveProperty('BALANCE');
    expect(STALE_TIMES).toHaveProperty('CAMPAIGN');
    expect(STALE_TIMES).toHaveProperty('GOVERNANCE');
    expect(STALE_TIMES).toHaveProperty('PROFILE');
    expect(STALE_TIMES).toHaveProperty('STATIC');
  });

  it('all values are positive milliseconds', () => {
    Object.values(STALE_TIMES).forEach((val) => {
      expect(val).toBeGreaterThan(0);
    });
  });
});

describe('GC_TIMES', () => {
  it('defines ascending garbage collection windows', () => {
    expect(GC_TIMES.SHORT).toBeLessThan(GC_TIMES.STANDARD);
    expect(GC_TIMES.STANDARD).toBeLessThan(GC_TIMES.LONG);
  });

  it('SHORT is 2 minutes', () => {
    expect(GC_TIMES.SHORT).toBe(2 * 60 * 1000);
  });

  it('STANDARD is 5 minutes', () => {
    expect(GC_TIMES.STANDARD).toBe(5 * 60 * 1000);
  });

  it('LONG is 15 minutes', () => {
    expect(GC_TIMES.LONG).toBe(15 * 60 * 1000);
  });
});

describe('RETRY_CONFIG', () => {
  it('API retries up to 2 times with exponential backoff', () => {
    expect(RETRY_CONFIG.API.retry).toBe(2);
    // Backoff: attempt 0 → 1000, attempt 1 → 2000, capped at 10_000
    expect(RETRY_CONFIG.API.retryDelay(0)).toBe(1000);
    expect(RETRY_CONFIG.API.retryDelay(1)).toBe(2000);
    expect(RETRY_CONFIG.API.retryDelay(10)).toBe(10_000);
  });

  it('CONTRACT retries once with fixed delay', () => {
    expect(RETRY_CONFIG.CONTRACT.retry).toBe(1);
    expect(RETRY_CONFIG.CONTRACT.retryDelay(0)).toBe(2000);
  });

  it('NONE has zero retries', () => {
    expect(RETRY_CONFIG.NONE.retry).toBe(0);
  });
});

describe('REFETCH_INTERVALS', () => {
  it('MEMPOOL polls every 15 seconds', () => {
    expect(REFETCH_INTERVALS.MEMPOOL).toBe(15_000);
  });

  it('BLOCK_HEIGHT polls every 30 seconds', () => {
    expect(REFETCH_INTERVALS.BLOCK_HEIGHT).toBe(30_000);
  });

  it('CAMPAIGN_COUNT polls every 60 seconds', () => {
    expect(REFETCH_INTERVALS.CAMPAIGN_COUNT).toBe(60_000);
  });
});
