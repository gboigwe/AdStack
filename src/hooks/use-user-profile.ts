'use client';

import { useReadOnlyCall } from './use-read-only-call';
import { CONTRACTS } from '@/lib/stacks-config';
import { isValidStacksAddress } from '@/lib/address-validation';

/**
 * Encode a standard Stacks principal as hex for read-only calls.
 * Clarity standard principal encoding: 0x05 + 1-byte version + 20-byte hash160
 * For simplicity, we pass the address string as a Clarity string-ascii arg.
 *
 * Note: The actual encoding depends on the contract's function signature.
 * If the contract expects a principal, the Hiro API needs the serialized
 * hex form. For now we use a simple hex encoding of the ASCII address
 * which works for contracts that accept (string-ascii) addresses.
 */
function encodeAddressArg(address: string): string {
  const hex = Array.from(new TextEncoder().encode(address))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  // Clarity string-ascii: type 0x0d + 4-byte length + content
  const len = (address.length).toString(16).padStart(8, '0');
  return `0x0d${len}${hex}`;
}

/**
 * Hook to fetch a user profile from the user-profiles contract.
 */
export function useUserProfile(address: string | undefined) {
  const isValid = address ? isValidStacksAddress(address) : false;

  return useReadOnlyCall({
    contractName: CONTRACTS.USER_PROFILES,
    functionName: 'get-profile',
    args: address && isValid ? [encodeAddressArg(address)] : [],
    enabled: !!address && isValid,
    staleTime: 60_000,
  });
}

/**
 * Hook to check if an address is registered.
 */
export function useIsRegistered(address: string | undefined) {
  const isValid = address ? isValidStacksAddress(address) : false;

  return useReadOnlyCall({
    contractName: CONTRACTS.USER_PROFILES,
    functionName: 'is-registered',
    args: address && isValid ? [encodeAddressArg(address)] : [],
    enabled: !!address && isValid,
    staleTime: 60_000,
  });
}

/**
 * Hook to check if a user is verified.
 * The contract checks both verification-status and expiry block height,
 * so this returns false for expired verifications.
 */
export function useIsVerified(address: string | undefined) {
  const isValid = address ? isValidStacksAddress(address) : false;

  return useReadOnlyCall({
    contractName: CONTRACTS.USER_PROFILES,
    functionName: 'is-verified',
    args: address && isValid ? [encodeAddressArg(address)] : [],
    enabled: !!address && isValid,
    staleTime: 120_000,
  });
}

/**
 * Hook to get a user's reputation score (0-100).
 */
export function useReputation(address: string | undefined) {
  const isValid = address ? isValidStacksAddress(address) : false;

  return useReadOnlyCall({
    contractName: CONTRACTS.USER_PROFILES,
    functionName: 'get-reputation',
    args: address && isValid ? [encodeAddressArg(address)] : [],
    enabled: !!address && isValid,
    staleTime: 300_000,
  });
}

/**
 * Hook to get platform-wide user count statistics.
 * Returns total users, advertisers, publishers, and viewers.
 */
export function useUserCounts() {
  return useReadOnlyCall({
    contractName: CONTRACTS.USER_PROFILES,
    functionName: 'get-user-counts',
    args: [],
    staleTime: 300_000,
    refetchInterval: 60_000,
  });
}
