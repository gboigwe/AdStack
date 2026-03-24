'use client';

import { useReadOnlyCall } from './use-read-only-call';
import { CONTRACTS } from '@/lib/stacks-config';
import { isValidStacksAddress } from '@/lib/address-validation';

/**
 * Encode a uint as a Clarity hex argument.
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
 * Hook to fetch the total proposal count from the vote-handler contract.
 */
export function useProposalCount() {
  return useReadOnlyCall({
    contractName: CONTRACTS.VOTE_HANDLER,
    functionName: 'get-proposal-count',
    args: [],
    staleTime: 30_000,
  });
}

/**
 * Hook to fetch a single governance proposal by ID.
 */
export function useProposal(proposalId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.VOTE_HANDLER,
    functionName: 'get-proposal',
    args: proposalId !== undefined ? [encodeUintArg(proposalId)] : [],
    enabled: proposalId !== undefined,
    staleTime: 30_000,
  });
}

/**
 * Hook to check if the current user has voted on a proposal.
 */
export function useHasVoted(proposalId: number | undefined, voterAddress: string | undefined) {
  const isValid = voterAddress ? isValidStacksAddress(voterAddress) : false;

  return useReadOnlyCall({
    contractName: CONTRACTS.VOTE_HANDLER,
    functionName: 'has-voted',
    args:
      proposalId !== undefined && voterAddress && isValid
        ? [encodeUintArg(proposalId), encodePrincipalArg(voterAddress)]
        : [],
    enabled: proposalId !== undefined && !!voterAddress && isValid,
    staleTime: 15_000,
  });
}

/**
 * Hook to get the vote tally for a proposal.
 * Returns votes for, votes against, and total voter count.
 */
export function useVoteTally(proposalId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.VOTE_HANDLER,
    functionName: 'get-vote-tally',
    args: proposalId !== undefined ? [encodeUintArg(proposalId)] : [],
    enabled: proposalId !== undefined,
    staleTime: 15_000,
  });
}

/**
 * Hook to check if governance is currently paused.
 */
export function useIsGovernancePaused() {
  return useReadOnlyCall({
    contractName: CONTRACTS.VOTE_HANDLER,
    functionName: 'is-governance-paused',
    args: [],
    staleTime: 60_000,
  });
}

/**
 * Hook to get proposal status.
 */
export function useProposalStatus(proposalId: number | undefined) {
  return useReadOnlyCall({
    contractName: CONTRACTS.VOTE_HANDLER,
    functionName: 'get-proposal-status',
    args: proposalId !== undefined ? [encodeUintArg(proposalId)] : [],
    enabled: proposalId !== undefined,
    staleTime: 15_000,
  });
}
