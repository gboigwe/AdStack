/**
 * React Hooks for Contract Interactions
 * Using Stacks.js v7+ with React Query
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { uintCV, stringAsciiCV, principalCV, ClarityValue } from '@stacks/transactions';
import { callContract, TransactionOptions, TransactionResult } from '../lib/transaction-builder';
import { callReadOnly, ReadOnlyOptions, ReadOnlyResult } from '../lib/read-only-calls';
import { parseStacksError } from '../lib/error-handler';
import { useWalletStore } from '../store/wallet-store';

/** Time in ms before cached contract data is considered stale */
const QUERY_STALE_TIME = 30000;

/** Interval in ms between automatic contract data refetches */
const QUERY_REFETCH_INTERVAL = 60000;

/** Type-safe query key for contract read operations */
type ContractQueryKey = readonly ['contract', string, string, ClarityValue[]];

/**
 * Hook for executing contract write operations with automatic cache invalidation
 * @returns React Query mutation object for contract calls with error parsing
 */
export function useContractCall() {
  const queryClient = useQueryClient();

  return useMutation<TransactionResult, Error, TransactionOptions>({
    mutationFn: async (options) => {
      return await callContract(options);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['contract', variables.contractName],
      });
    },
    onError: (error) => {
      const parsedError = parseStacksError(error);
      if (process.env.NODE_ENV === 'development') {
        console.error('[useContractCall]', parsedError.code, parsedError.message);
      }
    },
  });
}

/**
 * Hook for contract read-only queries with automatic caching and refetching
 * @param options - Read-only call configuration with contract name, function, and args
 * @param enabled - Whether the query should execute
 * @returns React Query result with typed data, loading, and error states
 */
export function useContractRead<T = unknown>(
  options: ReadOnlyOptions,
  enabled: boolean = true
) {
  return useQuery<ReadOnlyResult<T>, Error>({
    queryKey: ['contract', options.contractName, options.functionName, options.functionArgs] as ContractQueryKey,
    queryFn: () => callReadOnly<T>(options),
    enabled,
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
  });
}
