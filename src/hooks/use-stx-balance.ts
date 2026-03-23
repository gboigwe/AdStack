'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchStxBalance, type StxBalance } from '@/lib/stacks-api';

/**
 * React Query hook to fetch and cache an STX balance.
 * Refetches every 30 seconds while the component is mounted.
 */
export function useStxBalance(address: string | null) {
  return useQuery<StxBalance | null>({
    queryKey: ['stx-balance', address],
    queryFn: async () => {
      if (!address) return null;
      const result = await fetchStxBalance(address);
      if (result.ok && result.data) return result.data;
      throw new Error(result.error || 'Failed to fetch balance');
    },
    enabled: !!address,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
