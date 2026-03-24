'use client';

import { useState } from 'react';
import { Vote, Plus } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { WalletGuard } from '@/components/wallet/WalletGuard';
import { ProposalCard, type ProposalDisplay } from '@/components/governance';
import { buildCreateProposal } from '@/lib/contract-calls';
import { useContractCall } from '@/hooks/use-contract-call';
import { CONTRACTS, BLOCK_TIME } from '@/lib/stacks-config';

/** Placeholder proposals for the UI (contract data will replace these). */
const PLACEHOLDER_PROPOSALS: ProposalDisplay[] = [];

export default function GovernancePage() {
  const { address } = useWalletStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDesc, setProposalDesc] = useState('');
  const [proposalDays, setProposalDays] = useState('7');

  const { execute: submitProposal, isLoading: submittingProposal } = useContractCall({
    label: 'Create Proposal',
    invalidateKeys: [['read-only', CONTRACTS.VOTE_HANDLER]],
    onSuccess: () => {
      setShowCreateForm(false);
      setProposalTitle('');
      setProposalDesc('');
      setProposalDays('7');
    },
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleCreateProposal = () => {
    const errs: Record<string, string> = {};
    if (!proposalTitle.trim()) errs.title = 'Title is required';
    else if (proposalTitle.trim().length < 5) errs.title = 'Title must be at least 5 characters';
    else if (proposalTitle.trim().length > 100) errs.title = 'Title cannot exceed 100 characters';

    if (!proposalDesc.trim()) errs.desc = 'Description is required';
    else if (proposalDesc.trim().length < 20) errs.desc = 'Description must be at least 20 characters';

    const days = parseInt(proposalDays, 10);
    if (isNaN(days) || days < 1) errs.duration = 'Duration must be at least 1 day';
    else if (days > 30) errs.duration = 'Duration cannot exceed 30 days';

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const durationSeconds = days * BLOCK_TIME.SECONDS_PER_DAY;
    submitProposal(
      buildCreateProposal({
        title: proposalTitle.trim(),
        description: proposalDesc.trim(),
        duration: durationSeconds,
      }),
    );
  };

  return (
    <WalletGuard
      title="Connect to Participate"
      description="Connect your Stacks wallet to view and vote on governance proposals."
    >
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <Vote className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                Governance
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Vote on proposals that shape the AdStack protocol
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              New Proposal
            </button>
          </div>

          {/* Create Proposal Form */}
          {showCreateForm && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Create Proposal</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="proposal-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    id="proposal-title"
                    type="text"
                    value={proposalTitle}
                    onChange={(e) => { setProposalTitle(e.target.value); setFormErrors((p) => { const { title: _, ...r } = p; return r; }); }}
                    maxLength={100}
                    placeholder="Proposal title"
                    aria-invalid={!!formErrors.title}
                    aria-describedby={formErrors.title ? 'proposal-title-error' : 'proposal-title-hint'}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${formErrors.title ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
                  />
                  {formErrors.title ? (
                    <p id="proposal-title-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">{formErrors.title}</p>
                  ) : (
                    <p id="proposal-title-hint" className="text-xs text-gray-400 mt-1">{proposalTitle.length}/100</p>
                  )}
                </div>
                <div>
                  <label htmlFor="proposal-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="proposal-desc"
                    rows={3}
                    value={proposalDesc}
                    onChange={(e) => { setProposalDesc(e.target.value); setFormErrors((p) => { const { desc: _, ...r } = p; return r; }); }}
                    placeholder="Describe your proposal (at least 20 characters)..."
                    aria-invalid={!!formErrors.desc}
                    aria-describedby={formErrors.desc ? 'proposal-desc-error' : undefined}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${formErrors.desc ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
                  />
                  {formErrors.desc && (
                    <p id="proposal-desc-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">{formErrors.desc}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="proposal-duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Voting Duration (days)
                  </label>
                  <input
                    id="proposal-duration"
                    type="number"
                    min="1"
                    max="30"
                    value={proposalDays}
                    onChange={(e) => { setProposalDays(e.target.value); setFormErrors((p) => { const { duration: _, ...r } = p; return r; }); }}
                    aria-invalid={!!formErrors.duration}
                    aria-describedby={formErrors.duration ? 'proposal-duration-error' : undefined}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 ${formErrors.duration ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
                  />
                  {formErrors.duration && (
                    <p id="proposal-duration-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">{formErrors.duration}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateProposal}
                    disabled={submittingProposal || !proposalTitle.trim() || !proposalDesc.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {submittingProposal ? 'Submitting...' : 'Submit Proposal'}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Proposals List */}
          {PLACEHOLDER_PROPOSALS.length > 0 ? (
            <div className="space-y-4">
              {PLACEHOLDER_PROPOSALS.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Vote className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Proposals Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Governance proposals will appear here once the vote-handler
                contract is deployed. Be the first to create a proposal!
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create First Proposal
              </button>
            </div>
          )}
        </div>
      </div>
    </WalletGuard>
  );
}
