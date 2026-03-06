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

/**
 * Hook to fetch campaign details from the promo-manager contract
 * @param campaignId - The numeric ID of the campaign to fetch
 * @param enabled - Whether to execute the query
 */
export function useCampaign(campaignId: number, enabled: boolean = true) {
  return useContractRead(
    {
      contractName: 'promo-manager',
      functionName: 'get-campaign-details',
      functionArgs: [uintCV(BigInt(campaignId))],
    },
    enabled
  );
}

/**
 * Hook to fetch user profile from the user-profiles contract
 * @param userAddress - The Stacks address of the user
 * @param enabled - Whether to execute the query
 */
export function useUserProfile(userAddress: string, enabled: boolean = true) {
  return useContractRead(
    {
      contractName: 'user-profiles',
      functionName: 'get-user-details',
      functionArgs: [principalCV(userAddress)],
    },
    enabled && !!userAddress
  );
}

/**
 * Hook to fetch analytics metrics for a campaign
 * @param campaignId - The campaign to get metrics for
 * @param enabled - Whether to execute the query
 */
export function useAnalytics(campaignId: number, enabled: boolean = true) {
  return useContractRead(
    {
      contractName: 'stats-tracker',
      functionName: 'get-campaign-metrics',
      functionArgs: [uintCV(BigInt(campaignId))],
    },
    enabled
  );
}

/**
 * Hook to fetch escrow balance for a campaign
 * @param campaignId - The campaign to check escrow for
 * @param enabled - Whether to execute the query
 */
export function useEscrowBalance(campaignId: number, enabled: boolean = true) {
  return useContractRead<bigint>(
    {
      contractName: 'funds-keeper',
      functionName: 'get-escrow-balance',
      functionArgs: [uintCV(BigInt(campaignId))],
    },
    enabled
  );
}

/**
 * Hook to create a new advertising campaign
 * @returns Object with createCampaign function and mutation state
 */
export function useCreateCampaign() {
  const { mutate, ...rest } = useContractCall();

  const createCampaign = (params: {
    name: string;
    budget: bigint;
    dailyBudget: bigint;
    duration: number;
  }) => {
    mutate({
      contractName: 'promo-manager',
      functionName: 'create-campaign',
      functionArgs: [
        stringAsciiCV(params.name),
        uintCV(params.budget),
        uintCV(params.dailyBudget),
        uintCV(BigInt(params.duration)),
      ],
    });
  };

  return { createCampaign, ...rest };
}

/**
 * Hook to register a new user on the platform
 * @returns Object with registerUser function and mutation state
 */
export function useRegisterUser() {
  const { mutate, ...rest } = useContractCall();

  const registerUser = (params: { role: string; displayName: string }) => {
    mutate({
      contractName: 'user-profiles',
      functionName: 'register-user',
      functionArgs: [stringAsciiCV(params.role), stringAsciiCV(params.displayName)],
    });
  };

  return { registerUser, ...rest };
}

/**
 * Hook to access current wallet connection state
 * @returns Object with address, isConnected boolean, and isLoading state
 */
export function useWallet() {
  const { address, isConnected } = useWalletStore();
  return { address, isConnected, isLoading: false };
}

/**
 * Hook to fetch publisher earnings for a campaign
 * @param publisherAddress - The publisher's Stacks address
 * @param campaignId - The campaign ID
 * @param enabled - Whether to execute the query
 */
export function usePublisherEarnings(
  publisherAddress: string,
  campaignId: number,
  enabled: boolean = true
) {
  return useContractRead<bigint>(
    {
      contractName: 'cash-distributor',
      functionName: 'get-publisher-earnings',
      functionArgs: [principalCV(publisherAddress), uintCV(BigInt(campaignId))],
    },
    enabled && !!publisherAddress
  );
}

/**
 * Hook to fund an existing campaign with STX
 * @returns Object with fundCampaign function and mutation state
 */
export function useFundCampaign() {
  const { mutate, ...rest } = useContractCall();

  const fundCampaign = (params: { campaignId: number; amount: bigint }) => {
    mutate({
      contractName: 'promo-manager',
      functionName: 'fund-campaign',
      functionArgs: [uintCV(BigInt(params.campaignId)), uintCV(params.amount)],
    });
  };

  return { fundCampaign, ...rest };
}
