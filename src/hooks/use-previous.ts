'use client';

import { useRef, useEffect } from 'react';

/**
 * Returns the previous render's value for comparison.
 * Useful for detecting prop/state changes and running
 * conditional side effects.
 *
 * @example
 * const prevCount = usePrevious(count);
 * if (prevCount !== undefined && prevCount < count) {
 *   // count increased
 * }
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
