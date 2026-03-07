'use client';

import { fetchMempoolTransactions } from '@/lib/stacks-api';
import { useApiQuery } from './use-api-query';

/**
 * React Query hook to fetch pending mempool transactions for an address.
 * Refetches every 15 seconds since mempool state changes rapidly.
 */
export function useMempoolTransactions(
  address: string | undefined | null,
  limit = 10,
) {
  return useApiQuery(
    ['mempool', address, limit],
    () => fetchMempoolTransactions(address!, limit),
    {
      enabled: !!address,
      staleTime: 10_000,
      refetchInterval: 15_000,
      refetchIntervalInBackground: false,
    },
  );
}
