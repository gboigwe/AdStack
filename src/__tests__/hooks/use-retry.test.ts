import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRetry } from '@/hooks/use-retry';

describe('useRetry', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns the result on first success', async () => {
    const { result } = renderHook(() => useRetry<string>());
    let value: string | undefined;

    await act(async () => {
      value = await result.current.execute(() => Promise.resolve('ok'));
    });

    expect(value).toBe('ok');
    expect(result.current.attempt).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('retries on failure up to maxAttempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() =>
      useRetry({ maxAttempts: 2, baseDelay: 100 }),
    );

    const promise = act(async () => {
      await result.current.execute(fn);
    });

    // Advance through retry delays
    await act(async () => vi.advanceTimersByTime(100));
    await act(async () => vi.advanceTimersByTime(200));
    await promise;

    // initial call + 2 retries = 3
    expect(fn).toHaveBeenCalledTimes(3);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('succeeds on a later attempt after initial failures', async () => {
    let callCount = 0;
    const fn = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) return Promise.reject(new Error('not yet'));
      return Promise.resolve('success');
    });

    const { result } = renderHook(() =>
      useRetry<string>({ maxAttempts: 3, baseDelay: 50 }),
    );

    let value: string | undefined;
    const promise = act(async () => {
      value = await result.current.execute(fn);
    });

    await act(async () => vi.advanceTimersByTime(50));
    await act(async () => vi.advanceTimersByTime(100));
    await promise;

    expect(value).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('respects shouldRetry predicate', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fatal'));
    const shouldRetry = vi.fn().mockReturnValue(false);

    const { result } = renderHook(() =>
      useRetry({ maxAttempts: 3, baseDelay: 100, shouldRetry }),
    );

    await act(async () => {
      await result.current.execute(fn);
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledTimes(1);
  });

  it('reset clears state', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('err'));
    const { result } = renderHook(() =>
      useRetry({ maxAttempts: 0, baseDelay: 100 }),
    );

    await act(async () => {
      await result.current.execute(fn);
    });
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => result.current.reset());
    expect(result.current.error).toBeNull();
    expect(result.current.attempt).toBe(0);
  });
});
