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
 * Hook to fetch publisher earnings for a specific campaign.
 */
export function usePublisherEarnings(
  campaignId: number | undefined,
  publisherAddress: string | undefined,
) {
  const isValid = publisherAddress ? isValidStacksAddress(publisherAddress) : false;

  return useReadOnlyCall({
    contractName: CONTRACTS.CASH_DISTRIBUTOR,
    functionName: 'get-publisher-earnings',
    args:
      campaignId !== undefined && publisherAddress && isValid
        ? [encodeUintArg(campaignId), encodePrincipalArg(publisherAddress)]
        : [],
    enabled: campaignId !== undefined && !!publisherAddress && isValid,
    staleTime: 30_000,
  });
}

/**
 * Hook to fetch claimable payout amount for a publisher.
 */
export function useClaimableAmount(
  campaignId: number | undefined,
  publisherAddress: string | undefined,
) {
  const isValid = publisherAddress ? isValidStacksAddress(publisherAddress) : false;

  return useReadOnlyCall({
    contractName: CONTRACTS.CASH_DISTRIBUTOR,
    functionName: 'get-claimable-amount',
    args:
      campaignId !== undefined && publisherAddress && isValid
        ? [encodeUintArg(campaignId), encodePrincipalArg(publisherAddress)]
        : [],
    enabled: campaignId !== undefined && !!publisherAddress && isValid,
    staleTime: 15_000,
  });
}

/**
 * Hook to fetch publisher totals across all campaigns.
 */
export function usePublisherTotals(publisherAddress: string | undefined) {
  const isValid = publisherAddress ? isValidStacksAddress(publisherAddress) : false;

  return useReadOnlyCall({
    contractName: CONTRACTS.CASH_DISTRIBUTOR,
    functionName: 'get-publisher-totals',
    args: publisherAddress && isValid ? [encodePrincipalArg(publisherAddress)] : [],
    enabled: !!publisherAddress && isValid,
    staleTime: 30_000,
  });
}

/**
 * Hook to fetch platform distribution statistics.
 */
export function useDistributionStats() {
  return useReadOnlyCall({
    contractName: CONTRACTS.CASH_DISTRIBUTOR,
    functionName: 'get-distribution-stats',
    args: [],
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
