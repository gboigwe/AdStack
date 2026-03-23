'use client';

import { useRef, useCallback, useEffect } from 'react';

/**
 * Returns a throttled version of the provided callback.
 *
 * The callback fires immediately on the first call, then at most
 * once per `delay` ms. A trailing call is queued if the function
 * is invoked during the cooldown period so the last value is never lost.
 *
 * @param callback - Function to throttle
 * @param delay - Minimum interval between invocations in ms
 *
 * @example
 * const throttledSearch = useThrottle((query: string) => {
 *   fetchResults(query);
 * }, 300);
 */
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): T {
  const lastRun = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const callbackRef = useRef(callback);

  // Keep the callback ref fresh without re-creating the throttled fn
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const throttled = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const elapsed = now - lastRun.current;

      if (elapsed >= delay) {
        lastRun.current = now;
        callbackRef.current(...args);
      } else {
        // Schedule a trailing call
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          lastRun.current = Date.now();
          callbackRef.current(...args);
        }, delay - elapsed);
      }
    },
    [delay],
  ) as T;

  return throttled;
}
