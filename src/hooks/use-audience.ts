'use client';

import { useReadOnlyCall } from './use-read-only-call';
import { CONTRACTS } from '@/lib/stacks-config';
import { isValidStacksAddress } from '@/lib/address-validation';

function encodeUintArg(value: number): string {
  return `0x01${value.toString(16).padStart(32, '0')}`;
}

function encodePrincipalArg(address: string): string {
  const hex = Array.from(new TextEncoder().encode(address))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const len = address.length.toString(16).padStart(8, '0');
  return `0x0d${len}${hex}`;
}

/**
 * Hook to fetch an audience segment by ID.
 */
export function useAudienceSegment(segmentId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.AUDIENCE_SELECTOR,
    functionName: 'get-segment',
    args: segmentId !== undefined ? [encodeUintArg(segmentId)] : [],
    enabled: segmentId !== undefined,
    staleTime: 60_000,
  });
}

/**
 * Hook to fetch the number of audience segments for a campaign.
 */
export function useCampaignSegmentCount(campaignId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.AUDIENCE_SELECTOR,
    functionName: 'get-campaign-segment-count',
    args: campaignId !== undefined ? [encodeUintArg(campaignId)] : [],
    enabled: campaignId !== undefined,
    staleTime: 60_000,
  });
}

/**
 * Hook to fetch a publisher's audience profile.
 */
export function usePublisherAudienceProfile(address: string | undefined) {
  const isValid = address ? isValidStacksAddress(address) : false;

  return useReadOnlyCall({
    contractName: CONTRACTS.AUDIENCE_SELECTOR,
    functionName: 'get-publisher-profile',
    args: address && isValid ? [encodePrincipalArg(address)] : [],
    enabled: !!address && isValid,
    staleTime: 120_000,
  });
}

/**
 * Hook to fetch match score between a segment and publisher.
 */
export function useMatchScore(
  segmentId: number | undefined,
  publisherAddress: string | undefined,
) {
  const isValid = publisherAddress ? isValidStacksAddress(publisherAddress) : false;
  const enabled = segmentId !== undefined && !!publisherAddress && isValid;

  return useReadOnlyCall({
    contractName: CONTRACTS.AUDIENCE_SELECTOR,
    functionName: 'get-match-score',
    args: enabled
      ? [encodeUintArg(segmentId!), encodePrincipalArg(publisherAddress!)]
      : [],
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Hook to get total number of audience segments on platform.
 */
export function useTotalSegments() {
  return useReadOnlyCall({
    contractName: CONTRACTS.AUDIENCE_SELECTOR,
    functionName: 'get-total-segments',
    args: [],
    enabled: true,
    staleTime: 120_000,
  });
}

/**
 * Hook to get total number of registered publisher profiles.
 */
export function useTotalPublisherProfiles() {
  return useReadOnlyCall({
    contractName: CONTRACTS.AUDIENCE_SELECTOR,
    functionName: 'get-total-publisher-profiles',
    args: [],
    enabled: true,
    staleTime: 120_000,
  });
}
