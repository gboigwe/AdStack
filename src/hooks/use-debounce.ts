'use client';

import { useState, useEffect } from 'react';

/**
 * Debounce a value by delaying updates until after a specified period
 * of inactivity. Useful for search inputs and other rapid-fire state
 * changes that trigger expensive operations (API calls, filtering).
 *
 * @param value - The value to debounce
 * @param delayMs - Delay in milliseconds (default 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
