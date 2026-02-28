'use client';

import { useState } from 'react';
import { History, ChevronDown, ChevronUp, Scale, DollarSign, AlertTriangle } from 'lucide-react';
import { OUTCOME_TYPES, PENALTY_TYPES, type Judgment, type Appeal } from './types';

interface JudgmentRecord {
  judgment: Judgment;
  appeals: Appeal[];
}

interface JudgmentHistoryProps {
  records?: JudgmentRecord[];
}

const outcomeColors: Record<number, string> = {
  1: 'bg-green-50 text-green-700 border-green-200',
  2: 'bg-blue-50 text-blue-700 border-blue-200',
  3: 'bg-purple-50 text-purple-700 border-purple-200',
  4: 'bg-gray-50 text-gray-700 border-gray-200',
  5: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function JudgmentHistory({ records = [] }: JudgmentHistoryProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggle = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const totalAwarded = records.reduce(
    (sum, r) => sum + r.judgment.claimantAward + r.judgment.respondentAward,
    0
  );
  const totalFees = records.reduce((sum, r) => sum + r.judgment.arbitratorFee, 0);
  const appealedCount = records.filter((r) => r.appeals.length > 0).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-50 rounded-lg">
          <History className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Judgment History</h3>
          <p className="text-sm text-gray-500">{records.length} judgments on record</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <DollarSign className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <p className="text-sm font-semibold text-gray-900">
            {(totalAwarded / 1_000_000).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">STX Awarded</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <Scale className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <p className="text-sm font-semibold text-gray-900">
            {(totalFees / 1_000_000).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">STX Fees</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <AlertTriangle className="w-4 h-4 text-gray-400 mx-auto mb-1" />
          <p className="text-sm font-semibold text-gray-900">{appealedCount}</p>
          <p className="text-xs text-gray-500">Appealed</p>
        </div>
      </div>

      {records.length === 0 ? (
        <p className="text-center text-gray-400 py-6 text-sm">No judgments recorded yet</p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const j = record.judgment;
            const expanded = expandedId === j.judgmentId;
            const colorClass = outcomeColors[j.outcome] || outcomeColors[4];

            return (
              <div key={j.judgmentId} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggle(j.judgmentId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
                      {OUTCOME_TYPES[j.outcome] || 'Unknown'}
                    </span>
                    <span className="text-sm text-gray-900">Case #{j.caseId}</span>
                    {j.penaltyLevel > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-xs">
                        {PENALTY_TYPES[j.penaltyLevel]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Block {j.issuedAt}</span>
                    {expanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Claimant Award</p>
                        <p className="text-sm font-medium text-gray-900">
                          {(j.claimantAward / 1_000_000).toFixed(6)} STX
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Respondent Award</p>
                        <p className="text-sm font-medium text-gray-900">
                          {(j.respondentAward / 1_000_000).toFixed(6)} STX
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Arbitrator Fee</p>
                        <p className="text-sm font-medium text-gray-900">
                          {(j.arbitratorFee / 1_000_000).toFixed(6)} STX
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="text-sm font-medium text-gray-900">
                          {j.finalized ? 'Finalized' : j.executed ? 'Executed' : 'Pending'}
                        </p>
                      </div>
                    </div>

                    {j.reasoning && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Reasoning</p>
                        <p className="text-sm text-gray-700">{j.reasoning}</p>
                      </div>
                    )}

                    {record.appeals.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">
                          Appeals ({record.appeals.length})
                        </p>
                        {record.appeals.map((a) => (
                          <div
                            key={a.appealRound}
                            className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
                          >
                            <span className="text-xs text-gray-600">
                              Round {a.appealRound}: {a.grounds.slice(0, 60)}
                              {a.grounds.length > 60 ? '...' : ''}
                            </span>
                            <span className={`text-xs font-medium ${
                              a.status === 2
                                ? 'text-green-600'
                                : a.status === 3
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }`}>
                              {a.status === 2 ? 'Granted' : a.status === 3 ? 'Denied' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
