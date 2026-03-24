import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThrottle } from '@/hooks';

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires immediately on first call', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 300));

    act(() => {
      result.current('a');
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('a');
  });

  it('throttles subsequent calls within the delay window', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 300));

    act(() => {
      result.current('first');
    });
    expect(callback).toHaveBeenCalledTimes(1);

    // Call again within the delay — should NOT fire immediately
    act(() => {
      vi.advanceTimersByTime(100);
      result.current('second');
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('fires trailing call after delay elapses', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 300));

    act(() => {
      result.current('first');
    });

    act(() => {
      vi.advanceTimersByTime(100);
      result.current('trailing');
    });

    // Advance past the remaining delay (300 - 100 = 200ms)
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('trailing');
  });

  it('allows call after delay has fully elapsed', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 300));

    act(() => {
      result.current('first');
    });

    act(() => {
      vi.advanceTimersByTime(300);
      result.current('second');
    });

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('second');
  });

  it('replaces queued trailing call with latest', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottle(callback, 300));

    act(() => {
      result.current('first');
    });

    // Multiple calls during cooldown — only last should trail
    act(() => {
      vi.advanceTimersByTime(50);
      result.current('a');
      vi.advanceTimersByTime(50);
      result.current('b');
      vi.advanceTimersByTime(50);
      result.current('c');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('c');
  });

  it('clears timer on unmount', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useThrottle(callback, 300));

    act(() => {
      result.current('first');
      vi.advanceTimersByTime(100);
      result.current('trailing');
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Only the first immediate call should have fired
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('uses the latest callback via ref', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ cb }) => useThrottle(cb, 300),
      { initialProps: { cb: callback1 } },
    );

    act(() => {
      result.current('first');
    });
    expect(callback1).toHaveBeenCalledTimes(1);

    // Update callback
    rerender({ cb: callback2 });

    act(() => {
      vi.advanceTimersByTime(300);
      result.current('second');
    });

    expect(callback2).toHaveBeenCalledWith('second');
    expect(callback1).toHaveBeenCalledTimes(1);
  });
});
