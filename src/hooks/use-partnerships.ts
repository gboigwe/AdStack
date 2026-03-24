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
 * Hook to fetch partnership details by ID.
 */
export function usePartnership(partnershipId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.PARTNER_HUB,
    functionName: 'get-partnership',
    args: partnershipId !== undefined ? [encodeUintArg(partnershipId)] : [],
    enabled: partnershipId !== undefined,
    staleTime: 30_000,
  });
}

/**
 * Hook to look up a partnership between two parties.
 */
export function usePartnershipByParties(
  advertiserAddress: string | undefined,
  publisherAddress: string | undefined,
) {
  const advValid = advertiserAddress ? isValidStacksAddress(advertiserAddress) : false;
  const pubValid = publisherAddress ? isValidStacksAddress(publisherAddress) : false;
  const enabled = !!advertiserAddress && advValid && !!publisherAddress && pubValid;

  return useReadOnlyCall({
    contractName: CONTRACTS.PARTNER_HUB,
    functionName: 'get-partnership-by-parties',
    args: enabled
      ? [encodePrincipalArg(advertiserAddress!), encodePrincipalArg(publisherAddress!)]
      : [],
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Hook to check if a partnership is currently active.
 */
export function useIsPartnershipActive(partnershipId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.PARTNER_HUB,
    functionName: 'is-partnership-active',
    args: partnershipId !== undefined ? [encodeUintArg(partnershipId)] : [],
    enabled: partnershipId !== undefined,
    staleTime: 30_000,
  });
}

/**
 * Hook to get total active partnerships on the platform.
 */
export function useTotalActivePartnerships() {
  return useReadOnlyCall({
    contractName: CONTRACTS.PARTNER_HUB,
    functionName: 'get-total-active-partnerships',
    args: [],
    enabled: true,
    staleTime: 60_000,
  });
}

/**
 * Hook to get total partnerships created on the platform.
 */
export function useTotalPartnerships() {
  return useReadOnlyCall({
    contractName: CONTRACTS.PARTNER_HUB,
    functionName: 'get-total-partnerships',
    args: [],
    enabled: true,
    staleTime: 60_000,
  });
}

/**
 * Hook to get partnership invitation details.
 */
export function usePartnershipInvitation(partnershipId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.PARTNER_HUB,
    functionName: 'get-invitation',
    args: partnershipId !== undefined ? [encodeUintArg(partnershipId)] : [],
    enabled: partnershipId !== undefined,
    staleTime: 60_000,
  });
}

/**
 * Hook to get campaign enrollment in a partnership.
 */
export function useCampaignEnrollment(
  partnershipId: number | undefined,
  campaignId: number | undefined,
) {
  const enabled = partnershipId !== undefined && campaignId !== undefined;

  return useReadOnlyCall({
    contractName: CONTRACTS.PARTNER_HUB,
    functionName: 'get-campaign-enrollment',
    args: enabled
      ? [encodeUintArg(partnershipId!), encodeUintArg(campaignId!)]
      : [],
    enabled,
    staleTime: 30_000,
  });
}

/**
 * Hook to get the commission rate for a partnership.
 */
export function useCommissionRate(partnershipId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.PARTNER_HUB,
    functionName: 'get-commission-rate',
    args: partnershipId !== undefined ? [encodeUintArg(partnershipId)] : [],
    enabled: partnershipId !== undefined,
    staleTime: 120_000,
  });
}

/**
 * Hook to check if partner platform is paused.
 */
export function useIsPartnerPlatformPaused() {
  return useReadOnlyCall({
    contractName: CONTRACTS.PARTNER_HUB,
    functionName: 'is-platform-paused',
    args: [],
    enabled: true,
    staleTime: 60_000,
  });
}
