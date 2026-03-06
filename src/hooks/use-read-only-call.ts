'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { callReadOnlyFunction } from '@/lib/stacks-api';
import { CONTRACT_ADDRESS } from '@/lib/stacks-config';

interface ReadOnlyCallOptions {
  contractName: string;
  functionName: string;
  args?: string[];
  senderAddress?: string;
  enabled?: boolean;
  staleTime?: number;
}

/**
 * React Query hook for read-only Clarity contract calls.
 * Returns the raw hex result string from the Hiro API.
 *
 * @example
 * const { data, isLoading } = useReadOnlyCall({
 *   contractName: 'promo-manager',
 *   functionName: 'get-campaign',
 *   args: ['0x0100000000000000000000000000000001'], // uint 1 as hex
 * });
 */
export function useReadOnlyCall({
  contractName,
  functionName,
  args = [],
  senderAddress,
  enabled = true,
  staleTime = 30_000,
}: ReadOnlyCallOptions) {
  const sender = senderAddress || CONTRACT_ADDRESS;

  return useQuery({
    queryKey: ['read-only', contractName, functionName, ...args],
    queryFn: async () => {
      const result = await callReadOnlyFunction(
        CONTRACT_ADDRESS,
        contractName,
        functionName,
        args,
        sender,
      );

      if (result.ok && result.data) {
        if (!result.data.okay) {
          throw new Error(`Contract returned error for ${contractName}.${functionName}`);
        }
        return result.data.result;
      }

      throw new Error(result.error || `Failed to call ${contractName}.${functionName}`);
    },
    enabled,
    staleTime,
  });
}
