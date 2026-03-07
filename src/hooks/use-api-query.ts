'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { ApiResult } from '@/lib/stacks-api';

/**
 * Wrapper around useQuery that works with our ApiResult<T> pattern.
 * Automatically extracts data from successful results and throws
 * errors with descriptive messages on failure.
 *
 * This eliminates the repetitive pattern of:
 *   if (result.ok && result.data) return result.data;
 *   throw new Error(result.error);
 *
 * @example
 * const { data: balance } = useApiQuery(
 *   ['stx-balance', address],
 *   () => fetchStxBalance(address!),
 *   { enabled: !!address }
 * );
 */
export function useApiQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<ApiResult<T>>,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T, Error>({
    queryKey,
    queryFn: async () => {
      const result = await queryFn();
      if (result.ok && result.data !== undefined) {
        return result.data;
      }
      throw new Error(
        result.error || `API request failed${result.status ? ` (${result.status})` : ''}`,
      );
    },
    ...options,
  });
}
