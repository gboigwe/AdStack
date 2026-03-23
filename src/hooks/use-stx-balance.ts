'use client';

import { fetchStxBalance } from '@/lib/stacks-api';
import { useApiQuery } from './use-api-query';

/**
 * React Query hook to fetch and cache an STX balance.
 * Refetches every 30 seconds while the component is mounted.
 * Pauses refetching when the document is hidden (tab not visible).
 */
export function useStxBalance(address: string | undefined | null) {
  return useApiQuery(
    ['stx-balance', address],
    () => fetchStxBalance(address!),
    {
      enabled: !!address,
      refetchInterval: 30_000,
      staleTime: 15_000,
      refetchIntervalInBackground: false,
    },
  );
}
