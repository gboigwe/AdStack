'use client';

import { useQuery } from '@tanstack/react-query';
import { callReadOnlyFunction } from '@/lib/stacks-api';
import { CONTRACT_ADDRESS, CURRENT_NETWORK } from '@/lib/stacks-config';

interface ReadOnlyCallOptions {
  contractName: string;
  functionName: string;
  args?: string[];
  senderAddress?: string;
  enabled?: boolean;
  staleTime?: number;
  /** Poll interval in ms. Set to `false` or 0 to disable. */
  refetchInterval?: number | false;
  /** Number of retry attempts on failure (default: 2). */
  retry?: number | false;
}

/**
 * Custom error class for contract call failures.
 * Preserves the contract function context for better debugging.
 */
export class ContractCallError extends Error {
  public readonly contractName: string;
  public readonly functionName: string;
  public readonly isContractError: boolean;

  constructor(contractName: string, functionName: string, message: string, isContractError = false) {
    super(`${contractName}.${functionName}: ${message}`);
    this.name = 'ContractCallError';
    this.contractName = contractName;
    this.functionName = functionName;
    this.isContractError = isContractError;
  }
}

/**
 * React Query hook for read-only Clarity contract calls.
 * Returns the raw hex result string from the Hiro API.
 *
 * Features:
 * - Automatic retry on transient failures (network errors, 5xx)
 * - No retry on contract errors (the contract returned an err)
 * - Network-aware query key scoping (prevents cross-network cache hits)
 *
 * @example
 * const { data, isLoading, error } = useReadOnlyCall({
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
  refetchInterval,
  retry = 2,
}: ReadOnlyCallOptions) {
  const sender = senderAddress || CONTRACT_ADDRESS;

  return useQuery({
    queryKey: ['read-only', CURRENT_NETWORK, contractName, functionName, ...args],
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
          throw new ContractCallError(
            contractName,
            functionName,
            'Contract returned an error response',
            true,
          );
        }
        return result.data.result;
      }

      throw new ContractCallError(
        contractName,
        functionName,
        result.error || 'API request failed',
      );
    },
    enabled,
    staleTime,
    refetchInterval: refetchInterval || undefined,
    retry: (failureCount, error) => {
      if (retry === false) return false;
      // Don't retry contract errors (the contract itself returned err)
      if (error instanceof ContractCallError && error.isContractError) return false;
      return failureCount < (typeof retry === 'number' ? retry : 2);
    },
  });
}
