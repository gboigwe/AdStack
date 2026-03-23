'use client';

import { fetchBlockHeight } from '@/lib/stacks-api';
import { useApiQuery } from './use-api-query';
import { STALE_TIMES, REFETCH_INTERVALS } from '@/lib/query-config';

/**
 * React Query hook to fetch and track the current Stacks block height.
 * Refetches every 60 seconds (roughly every 6 blocks).
 * Pauses when the tab is not visible.
 */
export function useBlockHeight() {
  return useApiQuery(
    ['block-height'],
    () => fetchBlockHeight(),
    {
      refetchInterval: REFETCH_INTERVALS.BLOCK_HEIGHT,
      staleTime: STALE_TIMES.BLOCK,
      refetchIntervalInBackground: false,
    },
  );
}
