'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Like useState but backed by localStorage for persistence across
 * page reloads and browser sessions.
 *
 * @param key   — localStorage key
 * @param initialValue — fallback when no stored value exists
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Storage full or blocked — keep going with in-memory state
        }
        return next;
      });
    },
    [key],
  );

  // Sync across tabs via StorageEvent
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key !== key || e.newValue === null) return;
      try {
        setStoredValue(JSON.parse(e.newValue) as T);
      } catch {
        // ignore malformed data
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  return [storedValue, setValue];
}
