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
  const validAddress = address && address.length > 0 ? address : undefined;
  const clampedLimit = Math.min(Math.max(1, limit), 50);

  return useApiQuery(
    ['mempool', validAddress, clampedLimit],
    () => fetchMempoolTransactions(validAddress!, clampedLimit),
    {
      enabled: !!validAddress,
      staleTime: 10_000,
      refetchInterval: 15_000,
      refetchIntervalInBackground: false,
    },
  );
}
