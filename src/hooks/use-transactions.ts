'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTransactions, type TransactionList } from '@/lib/stacks-api';

/**
 * React Query hook to fetch paginated transaction history for an address.
 */
export function useTransactions(
  address: string | null,
  limit = 20,
  offset = 0,
) {
  return useQuery<TransactionList | null>({
    queryKey: ['transactions', address, limit, offset],
    queryFn: async () => {
      if (!address) return null;
      const result = await fetchTransactions(address, limit, offset);
      if (result.ok && result.data) return result.data;
      throw new Error(result.error || 'Failed to fetch transactions');
    },
    enabled: !!address,
    staleTime: 30_000,
  });
}
