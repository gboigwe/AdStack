'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/**
 * Syncs component state to URL search parameters.
 * Reads current values from the URL and provides an update function
 * that merges changes into the query string via shallow navigation.
 *
 * @param defaults — fallback values when a param is missing from the URL
 */
export function useQueryParams<T extends Record<string, string>>(
  defaults: T,
): [T, (updates: Partial<T>) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo(() => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const value = searchParams.get(key);
      if (value !== null) {
        (result as Record<string, string>)[key] = value;
      }
    }
    return result;
  }, [searchParams, defaults]);

  const update = useCallback(
    (updates: Partial<T>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== defaults[key as keyof T]) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router, pathname, searchParams, defaults],
  );

  return [state, update];
}
