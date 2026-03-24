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
 * Hook to fetch campaign fraud score and threat level.
 */
export function useCampaignFraudScore(campaignId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.THREAT_DETECTOR,
    functionName: 'get-campaign-score',
    args: campaignId !== undefined ? [encodeUintArg(campaignId)] : [],
    enabled: campaignId !== undefined,
    staleTime: 60_000,
  });
}

/**
 * Hook to fetch threat level for a campaign (0-4).
 */
export function useThreatLevel(campaignId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.THREAT_DETECTOR,
    functionName: 'get-threat-level',
    args: campaignId !== undefined ? [encodeUintArg(campaignId)] : [],
    enabled: campaignId !== undefined,
    staleTime: 60_000,
  });
}

/**
 * Hook to check if an account is blocked due to fraud.
 */
export function useIsAccountBlocked(address: string | undefined) {
  const isValid = address ? isValidStacksAddress(address) : false;

  return useReadOnlyCall({
    contractName: CONTRACTS.THREAT_DETECTOR,
    functionName: 'is-account-blocked',
    args: address && isValid ? [encodePrincipalArg(address)] : [],
    enabled: !!address && isValid,
    staleTime: 120_000,
  });
}

/**
 * Hook to fetch account threat details.
 */
export function useAccountThreats(address: string | undefined) {
  const isValid = address ? isValidStacksAddress(address) : false;

  return useReadOnlyCall({
    contractName: CONTRACTS.THREAT_DETECTOR,
    functionName: 'get-account-threats',
    args: address && isValid ? [encodePrincipalArg(address)] : [],
    enabled: !!address && isValid,
    staleTime: 60_000,
  });
}
