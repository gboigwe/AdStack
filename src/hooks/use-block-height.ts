'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchBlockHeight } from '@/lib/stacks-api';

/**
 * React Query hook to fetch and track the current Stacks block height.
 * Refetches every 60 seconds (roughly every 6 blocks).
 */
export function useBlockHeight() {
  return useQuery<number>({
    queryKey: ['block-height'],
    queryFn: async () => {
      const result = await fetchBlockHeight();
      if (result.ok && result.data !== undefined) return result.data;
      throw new Error(result.error || 'Failed to fetch block height');
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
