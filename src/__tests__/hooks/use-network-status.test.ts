import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '@/hooks';

describe('useNetworkStatus', () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    // Default to online
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });
  });

  it('returns isOnline as true when navigator is online', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
  });

  it('returns isOnline as false when navigator is offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);
  });

  it('updates when going offline', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('updates when coming back online', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);

    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('provides a waitForOnline function', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(typeof result.current.waitForOnline).toBe('function');
  });

  it('waitForOnline resolves immediately when already online', async () => {
    const { result } = renderHook(() => useNetworkStatus());
    await expect(result.current.waitForOnline()).resolves.toBeUndefined();
  });

  it('waitForOnline waits for online event when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useNetworkStatus());
    let resolved = false;

    const promise = result.current.waitForOnline().then(() => {
      resolved = true;
    });

    // Should not have resolved yet
    await vi.advanceTimersByTimeAsync?.(0) ?? Promise.resolve();
    expect(resolved).toBe(false);

    // Simulate going online
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
    window.dispatchEvent(new Event('online'));

    await promise;
    expect(resolved).toBe(true);
  });
});
