'use client';

import { useState, useCallback } from 'react';
import { Vote, ThumbsUp, ThumbsDown, Scale, Send } from 'lucide-react';
import { OUTCOME_TYPES, type Judgment } from './types';

interface VotingInterfaceProps {
  caseId: number;
  claimant: string;
  respondent: string;
  amountAtStake: number;
  existingJudgment?: Judgment;
  onVote?: (data: {
    caseId: number;
    outcome: number;
    reasoning: string;
  }) => void;
}

export function VotingInterface({
  caseId,
  claimant,
  respondent,
  amountAtStake,
  existingJudgment,
  onVote,
}: VotingInterfaceProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(() => {
    if (selectedOutcome === null || !reasoning) return;
    setSubmitting(true);
    onVote?.({ caseId, outcome: selectedOutcome, reasoning });
    setSubmitting(false);
  }, [caseId, selectedOutcome, reasoning, onVote]);

  const outcomeOptions = [
    { value: 1, label: 'Claimant Wins', icon: ThumbsUp, color: 'border-green-300 bg-green-50 text-green-800', activeColor: 'border-green-500 bg-green-100 ring-2 ring-green-500' },
    { value: 2, label: 'Respondent Wins', icon: ThumbsDown, color: 'border-blue-300 bg-blue-50 text-blue-800', activeColor: 'border-blue-500 bg-blue-100 ring-2 ring-blue-500' },
    { value: 3, label: 'Split Award', icon: Scale, color: 'border-yellow-300 bg-yellow-50 text-yellow-800', activeColor: 'border-yellow-500 bg-yellow-100 ring-2 ring-yellow-500' },
    { value: 4, label: 'Dismiss', icon: Vote, color: 'border-gray-300 bg-gray-50 text-gray-800', activeColor: 'border-gray-500 bg-gray-100 ring-2 ring-gray-500' },
  ];

  if (existingJudgment) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-50 rounded-lg">
            <Vote className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Judgment Issued</h3>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">Outcome</p>
            <p className="text-lg font-semibold text-gray-900">
              {OUTCOME_TYPES[existingJudgment.outcome]}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-xl font-bold text-green-700">
                {(existingJudgment.claimantAward / 1000000).toFixed(2)}
              </p>
              <p className="text-xs text-green-600">Claimant Award (STX)</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-xl font-bold text-blue-700">
                {(existingJudgment.respondentAward / 1000000).toFixed(2)}
              </p>
              <p className="text-xs text-blue-600">Respondent Award (STX)</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Reasoning</p>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {existingJudgment.reasoning}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Platform Fee: {(existingJudgment.platformFee / 1000000).toFixed(4)} STX</span>
            {existingJudgment.penaltyAmount > 0 && (
              <span className="text-red-600">
                Penalty: {(existingJudgment.penaltyAmount / 1000000).toFixed(4)} STX
              </span>
            )}
            <span className={existingJudgment.executed ? 'text-green-600' : 'text-yellow-600'}>
              {existingJudgment.executed ? 'Executed' : 'Pending Execution'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Vote className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Cast Vote</h3>
          <p className="text-sm text-gray-500">Case #{caseId} | {(amountAtStake / 1000000).toFixed(2)} STX at stake</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div className="p-2 bg-gray-50 rounded-lg">
          <span className="text-gray-500">Claimant: </span>
          <span className="font-mono text-gray-900">{claimant.substring(0, 12)}...</span>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg">
          <span className="text-gray-500">Respondent: </span>
          <span className="font-mono text-gray-900">{respondent.substring(0, 12)}...</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Outcome</label>
          <div className="grid grid-cols-2 gap-3">
            {outcomeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedOutcome === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSelectedOutcome(opt.value)}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                    isSelected ? opt.activeColor : opt.color
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reasoning</label>
          <textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Provide detailed reasoning for your decision..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{reasoning.length}/500</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || selectedOutcome === null || !reasoning}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Submitting...' : 'Submit Vote'}
        </button>
      </div>
    </div>
  );
}
