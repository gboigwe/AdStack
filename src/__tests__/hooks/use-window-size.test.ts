import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWindowSize } from '@/hooks';

describe('useWindowSize', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  it('returns current window dimensions', () => {
    const { result } = renderHook(() => useWindowSize());
    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it('updates on window resize', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 800 });
      Object.defineProperty(window, 'innerHeight', { value: 600 });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.width).toBe(800);
    expect(result.current.height).toBe(600);
  });

  it('cleans up resize listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useWindowSize());

    unmount();

    expect(removeSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
    );
    removeSpy.mockRestore();
  });

  it('reflects multiple resize events', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1280 });
      Object.defineProperty(window, 'innerHeight', { value: 900 });
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.width).toBe(1280);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current.width).toBe(375);
    expect(result.current.height).toBe(667);
  });
});
