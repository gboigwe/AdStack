'use client';

import { fetchBlockHeight } from '@/lib/stacks-api';
import { useApiQuery } from './use-api-query';

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
      refetchInterval: 60_000,
      staleTime: 30_000,
      refetchIntervalInBackground: false,
    },
  );
}
