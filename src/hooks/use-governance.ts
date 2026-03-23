'use client';

import { useReadOnlyCall } from './use-read-only-call';
import { CONTRACTS } from '@/lib/stacks-config';

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
  const hexArg = proposalId !== undefined
    ? `0x01${proposalId.toString(16).padStart(32, '0')}`
    : '';

  return useReadOnlyCall({
    contractName: CONTRACTS.VOTE_HANDLER,
    functionName: 'get-proposal',
    args: hexArg ? [hexArg] : [],
    enabled: proposalId !== undefined,
    staleTime: 30_000,
  });
}

/**
 * Hook to check if the current user has voted on a proposal.
 */
export function useHasVoted(proposalId: number | undefined, voterAddress: string | undefined) {
  const proposalHex = proposalId !== undefined
    ? `0x01${proposalId.toString(16).padStart(32, '0')}`
    : '';

  // Encode voter address as string-ascii
  const voterHex = voterAddress
    ? `0x0d${voterAddress.length.toString(16).padStart(8, '0')}${Array.from(new TextEncoder().encode(voterAddress)).map((b) => b.toString(16).padStart(2, '0')).join('')}`
    : '';

  return useReadOnlyCall({
    contractName: CONTRACTS.VOTE_HANDLER,
    functionName: 'has-voted',
    args: proposalHex && voterHex ? [proposalHex, voterHex] : [],
    enabled: proposalId !== undefined && !!voterAddress,
    staleTime: 15_000,
  });
}
