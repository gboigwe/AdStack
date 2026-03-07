'use client';

import { fetchTransactions } from '@/lib/stacks-api';
import { useApiQuery } from './use-api-query';

/**
 * React Query hook to fetch paginated transaction history for an address.
 */
export function useTransactions(
  address: string | undefined | null,
  limit = 20,
  offset = 0,
) {
  return useApiQuery(
    ['transactions', address, limit, offset],
    () => fetchTransactions(address!, limit, offset),
    {
      enabled: !!address,
      staleTime: 30_000,
    },
  );
}
