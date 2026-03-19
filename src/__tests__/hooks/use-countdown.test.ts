import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '@/hooks';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-19T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates remaining seconds from target date', () => {
    // 60 seconds in the future
    const target = new Date('2026-03-19T12:01:00Z');
    const { result } = renderHook(() => useCountdown(target));

    expect(result.current.remaining).toBe(60);
    expect(result.current.isComplete).toBe(false);
  });

  it('returns zero and isComplete=true for past dates', () => {
    const past = new Date('2026-03-19T11:00:00Z');
    const { result } = renderHook(() => useCountdown(past));

    expect(result.current.remaining).toBe(0);
    expect(result.current.isComplete).toBe(true);
  });

  it('splits remaining into days, hours, minutes, seconds', () => {
    // 1 day 2 hours 3 minutes 4 seconds = 93784 seconds
    const target = new Date(Date.now() + 93784 * 1000);
    const { result } = renderHook(() => useCountdown(target));

    expect(result.current.parts.days).toBe(1);
    expect(result.current.parts.hours).toBe(2);
    expect(result.current.parts.minutes).toBe(3);
    expect(result.current.parts.seconds).toBe(4);
  });

  it('ticks down every second', () => {
    const target = new Date('2026-03-19T12:00:05Z'); // 5 seconds ahead
    const { result } = renderHook(() => useCountdown(target));

    expect(result.current.remaining).toBe(5);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remaining).toBe(4);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.remaining).toBe(2);
  });

  it('stops at zero and marks isComplete', () => {
    const target = new Date('2026-03-19T12:00:02Z'); // 2 seconds ahead
    const { result } = renderHook(() => useCountdown(target));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.remaining).toBe(0);
    expect(result.current.isComplete).toBe(true);
  });

  it('handles null target date', () => {
    const { result } = renderHook(() => useCountdown(null));

    expect(result.current.remaining).toBe(0);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.parts).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it('restart sets a new target and recalculates', () => {
    const initial = new Date('2026-03-19T12:00:10Z'); // 10 seconds
    const { result } = renderHook(() => useCountdown(initial));

    expect(result.current.remaining).toBe(10);

    // Restart with a new target 30 seconds from now
    act(() => {
      result.current.restart(new Date('2026-03-19T12:00:30Z'));
    });

    expect(result.current.remaining).toBe(30);
  });
});
