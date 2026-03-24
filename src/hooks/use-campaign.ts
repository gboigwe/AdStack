'use client';

import { useReadOnlyCall } from './use-read-only-call';
import { CONTRACTS } from '@/lib/stacks-config';

/**
 * Encode a campaign ID as a Clarity uint hex argument.
 */
function encodeCampaignIdArg(campaignId: number): string {
  return `0x01${campaignId.toString(16).padStart(32, '0')}`;
}

/**
 * Hook to fetch a single campaign by ID from the promo-manager contract.
 * Returns the raw Clarity hex result which the caller can decode.
 */
export function useCampaign(campaignId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'get-campaign',
    args: campaignId !== undefined ? [encodeCampaignIdArg(campaignId)] : [],
    enabled: campaignId !== undefined,
    staleTime: 60_000,
  });
}

/**
 * Hook to fetch total campaign count from the promo-manager contract.
 * Polls every 60s by default so the dashboard stays fresh.
 */
export function useCampaignCount(refetchInterval = 60_000) {
  return useReadOnlyCall({
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'get-campaign-count',
    args: [],
    staleTime: 30_000,
    refetchInterval,
  });
}

/**
 * Hook to check remaining budget for a campaign.
 */
export function useRemainingBudget(campaignId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'get-remaining-budget',
    args: campaignId !== undefined ? [encodeCampaignIdArg(campaignId)] : [],
    enabled: campaignId !== undefined,
    staleTime: 30_000,
  });
}

/**
 * Hook to check if a campaign is currently active.
 * Considers both status flag and block height expiry.
 */
export function useIsCampaignActive(campaignId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'is-campaign-active',
    args: campaignId !== undefined ? [encodeCampaignIdArg(campaignId)] : [],
    enabled: campaignId !== undefined,
    staleTime: 30_000,
  });
}

/**
 * Hook to get total STX locked across all active campaigns.
 */
export function useTotalStxLocked() {
  return useReadOnlyCall({
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'get-total-stx-locked',
    args: [],
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
