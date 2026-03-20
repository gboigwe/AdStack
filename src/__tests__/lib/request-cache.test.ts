import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deduplicatedFetch } from '@/lib/request-cache';

describe('deduplicatedFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the fetcher and returns its resolved value', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');

    const result = await deduplicatedFetch('key1', fetcher);
    expect(result).toBe('data');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent calls with the same key', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');

    const p1 = deduplicatedFetch('same-key', fetcher);
    const p2 = deduplicatedFetch('same-key', fetcher);

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe('data');
    expect(r2).toBe('data');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('does not deduplicate different keys', async () => {
    const fetcherA = vi.fn().mockResolvedValue('a');
    const fetcherB = vi.fn().mockResolvedValue('b');

    const p1 = deduplicatedFetch('key-a', fetcherA);
    const p2 = deduplicatedFetch('key-b', fetcherB);

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe('a');
    expect(r2).toBe('b');
    expect(fetcherA).toHaveBeenCalledTimes(1);
    expect(fetcherB).toHaveBeenCalledTimes(1);
  });

  it('creates a new request after dedup window expires', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');

    await deduplicatedFetch('key2', fetcher);

    // Advance past dedup window (200ms) plus cleanup
    await vi.advanceTimersByTimeAsync(300);

    await deduplicatedFetch('key2', fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('propagates fetcher rejection', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('fail'));

    await expect(deduplicatedFetch('err-key', fetcher)).rejects.toThrow('fail');
  });

  it('shares the rejection for deduplicated calls', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('boom'));

    const p1 = deduplicatedFetch('err-key2', fetcher);
    const p2 = deduplicatedFetch('err-key2', fetcher);

    await expect(p1).rejects.toThrow('boom');
    await expect(p2).rejects.toThrow('boom');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
