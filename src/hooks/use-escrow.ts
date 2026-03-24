'use client';

import { useReadOnlyCall } from './use-read-only-call';
import { CONTRACTS } from '@/lib/stacks-config';
import { isValidStacksAddress } from '@/lib/address-validation';

/**
 * Encode a campaign ID as a Clarity uint hex argument.
 */
function encodeUintArg(value: number): string {
  return `0x01${value.toString(16).padStart(32, '0')}`;
}

/**
 * Encode a principal address for read-only calls.
 */
function encodePrincipalArg(address: string): string {
  const hex = Array.from(new TextEncoder().encode(address))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const len = address.length.toString(16).padStart(8, '0');
  return `0x0d${len}${hex}`;
}

/**
 * Hook to fetch escrow details for a campaign.
 */
export function useEscrow(campaignId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.FUNDS_KEEPER,
    functionName: 'get-escrow',
    args: campaignId !== undefined ? [encodeUintArg(campaignId)] : [],
    enabled: campaignId !== undefined,
    staleTime: 30_000,
  });
}

/**
 * Hook to fetch available escrow balance for a campaign.
 */
export function useEscrowBalance(campaignId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.FUNDS_KEEPER,
    functionName: 'get-escrow-balance',
    args: campaignId !== undefined ? [encodeUintArg(campaignId)] : [],
    enabled: campaignId !== undefined,
    staleTime: 30_000,
  });
}

/**
 * Hook to fetch publisher release record for a campaign.
 */
export function usePublisherRelease(
  campaignId: number | undefined,
  publisherAddress: string | undefined,
) {
  const isValid = publisherAddress ? isValidStacksAddress(publisherAddress) : false;

  return useReadOnlyCall({
    contractName: CONTRACTS.FUNDS_KEEPER,
    functionName: 'get-publisher-release',
    args:
      campaignId !== undefined && publisherAddress && isValid
        ? [encodeUintArg(campaignId), encodePrincipalArg(publisherAddress)]
        : [],
    enabled: campaignId !== undefined && !!publisherAddress && isValid,
    staleTime: 30_000,
  });
}

/**
 * Hook to fetch platform-wide fund statistics.
 */
export function usePlatformFundStats() {
  return useReadOnlyCall({
    contractName: CONTRACTS.FUNDS_KEEPER,
    functionName: 'get-platform-stats',
    args: [],
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
