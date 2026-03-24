'use client';

import { useReadOnlyCall } from './use-read-only-call';
import { CONTRACTS } from '@/lib/stacks-config';
import { isValidStacksAddress } from '@/lib/address-validation';

/**
 * Encode a campaign ID as a Clarity uint hex argument.
 * Clarity uint encoding: type 0x01 + 16-byte big-endian value.
 */
function encodeCampaignIdArg(campaignId: number): string {
  return `0x01${campaignId.toString(16).padStart(32, '0')}`;
}

/**
 * Encode a principal argument for read-only calls.
 */
function encodePrincipalArg(address: string): string {
  const hex = Array.from(new TextEncoder().encode(address))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const len = address.length.toString(16).padStart(8, '0');
  return `0x0d${len}${hex}`;
}

/**
 * Hook to fetch campaign analytics from the stats-tracker contract.
 * Returns aggregate metrics: total views, unique viewers, spend, last view.
 */
export function useCampaignAnalytics(campaignId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.STATS_TRACKER,
    functionName: 'get-analytics',
    args: campaignId !== undefined ? [encodeCampaignIdArg(campaignId)] : [],
    enabled: campaignId !== undefined,
    staleTime: 30_000,
  });
}

/**
 * Hook to fetch publisher stats for a specific campaign.
 */
export function usePublisherStats(
  campaignId: number | undefined,
  publisherAddress: string | undefined,
) {
  const isValid = publisherAddress ? isValidStacksAddress(publisherAddress) : false;

  return useReadOnlyCall({
    contractName: CONTRACTS.STATS_TRACKER,
    functionName: 'get-publisher-stats',
    args:
      campaignId !== undefined && publisherAddress && isValid
        ? [encodeCampaignIdArg(campaignId), encodePrincipalArg(publisherAddress)]
        : [],
    enabled: campaignId !== undefined && !!publisherAddress && isValid,
    staleTime: 30_000,
  });
}

/**
 * Hook to check if a viewer has seen a specific campaign ad.
 */
export function useHasViewed(
  campaignId: number | undefined,
  viewerAddress: string | undefined,
) {
  const isValid = viewerAddress ? isValidStacksAddress(viewerAddress) : false;

  return useReadOnlyCall({
    contractName: CONTRACTS.STATS_TRACKER,
    functionName: 'has-viewed',
    args:
      campaignId !== undefined && viewerAddress && isValid
        ? [encodeCampaignIdArg(campaignId), encodePrincipalArg(viewerAddress)]
        : [],
    enabled: campaignId !== undefined && !!viewerAddress && isValid,
    staleTime: 60_000,
  });
}

/**
 * Hook to get global platform view totals.
 */
export function useTotalViews() {
  return useReadOnlyCall({
    contractName: CONTRACTS.STATS_TRACKER,
    functionName: 'get-total-views',
    args: [],
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/**
 * Hook to get validated (non-fraudulent) view totals.
 */
export function useTotalValidViews() {
  return useReadOnlyCall({
    contractName: CONTRACTS.STATS_TRACKER,
    functionName: 'get-total-valid-views',
    args: [],
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
