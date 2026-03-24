import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClipboard } from '@/hooks';

describe('useClipboard', () => {
  const writeTextMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });
    writeTextMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    writeTextMock.mockReset();
  });

  it('starts with copied=false', () => {
    const { result } = renderHook(() => useClipboard());
    expect(result.current.copied).toBe(false);
  });

  it('copies text and sets copied=true', async () => {
    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('hello');
    });

    expect(writeTextMock).toHaveBeenCalledWith('hello');
    expect(result.current.copied).toBe(true);
  });

  it('resets copied after default 2000ms delay', async () => {
    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('test');
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(false);
  });

  it('respects custom resetDelay', async () => {
    const { result } = renderHook(() => useClipboard(500));

    await act(async () => {
      await result.current.copy('test');
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.copied).toBe(false);
  });

  it('returns true on successful copy', async () => {
    const { result } = renderHook(() => useClipboard());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.copy('text');
    });
    expect(success).toBe(true);
  });

  it('returns false and sets copied=false on clipboard failure', async () => {
    writeTextMock.mockRejectedValueOnce(new Error('denied'));

    const { result } = renderHook(() => useClipboard());

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.copy('text');
    });

    expect(success).toBe(false);
    expect(result.current.copied).toBe(false);
  });

  it('resets previous timer on rapid successive copies', async () => {
    const { result } = renderHook(() => useClipboard(1000));

    await act(async () => {
      await result.current.copy('first');
    });

    act(() => {
      vi.advanceTimersByTime(800);
    });

    // Copy again before first timer expires
    await act(async () => {
      await result.current.copy('second');
    });
    expect(result.current.copied).toBe(true);

    // Original timer would have fired here (200ms more), but should still be true
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.copied).toBe(true);

    // Now 1000ms from second copy
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current.copied).toBe(false);
  });
});
