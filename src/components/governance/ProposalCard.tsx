'use client';

import { memo } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui';
import { buildCastVote } from '@/lib/contract-calls';
import { useContractCall } from '@/hooks/use-contract-call';
import { CONTRACTS } from '@/lib/stacks-config';

/** Proposal shape matching the GovernanceProposal contract type. */
export interface ProposalDisplay {
  id: number;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  expiresAt: string;
}

function statusVariant(status: string) {
  switch (status) {
    case 'active':
      return 'info' as const;
    case 'passed':
      return 'success' as const;
    case 'rejected':
      return 'error' as const;
    case 'executed':
      return 'purple' as const;
    default:
      return 'default' as const;
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    case 'passed':
      return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
    case 'rejected':
      return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
    case 'executed':
      return <AlertCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    default:
      return null;
  }
}

/**
 * Governance proposal card with vote bar and action buttons.
 *
 * Memoized so that re-renders of the proposal list don't propagate
 * to every card when only one card's voting state changes.
 */
export const ProposalCard = memo(function ProposalCard({
  proposal,
}: {
  proposal: ProposalDisplay;
}) {
  const { execute: castVote, isLoading: voting } = useContractCall({
    label: `Vote on Proposal #${proposal.id}`,
    invalidateKeys: [['read-only', CONTRACTS.VOTE_HANDLER]],
  });

  const handleVote = (inFavor: boolean) => {
    castVote(buildCastVote(proposal.id, inFavor));
  };

  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  const forPercent =
    totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon status={proposal.status} />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {proposal.title}
          </h3>
        </div>
        <Badge variant={statusVariant(proposal.status)}>
          {proposal.status}
        </Badge>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {proposal.description}
      </p>

      {/* Vote bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>For: {proposal.votesFor}</span>
          <span>Against: {proposal.votesAgainst}</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all"
            style={{ width: `${forPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Expires: {proposal.expiresAt}
        </span>

        {proposal.status === 'active' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleVote(true)}
              disabled={voting}
              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {voting ? 'Voting...' : 'Vote For'}
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={voting}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {voting ? 'Voting...' : 'Vote Against'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
