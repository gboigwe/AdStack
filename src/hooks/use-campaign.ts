'use client';

import { useQuery } from '@tanstack/react-query';
import { useReadOnlyCall } from './use-read-only-call';
import { CONTRACTS } from '@/lib/stacks-config';

/**
 * Hook to fetch a single campaign by ID from the promo-manager contract.
 * Returns the raw Clarity hex result which the caller can decode.
 */
export function useCampaign(campaignId: number | undefined) {
  // Encode campaignId as a Clarity uint hex string (0x01 prefix + 16-byte big-endian)
  const hexArg = campaignId !== undefined
    ? `0x01${campaignId.toString(16).padStart(32, '0')}`
    : '';

  return useReadOnlyCall({
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'get-campaign',
    args: hexArg ? [hexArg] : [],
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
 * Hook to fetch campaign analytics from the stats-tracker contract.
 */
export function useCampaignAnalytics(campaignId: number | undefined) {
  const hexArg = campaignId !== undefined
    ? `0x01${campaignId.toString(16).padStart(32, '0')}`
    : '';

  return useReadOnlyCall({
    contractName: CONTRACTS.STATS_TRACKER,
    functionName: 'get-analytics',
    args: hexArg ? [hexArg] : [],
    enabled: campaignId !== undefined,
    staleTime: 30_000,
  });
}
