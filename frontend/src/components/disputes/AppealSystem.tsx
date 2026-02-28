'use client';

import { useState, useCallback } from 'react';
import { Scale, FileText, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { APPEAL_STATUS, OUTCOME_TYPES, type Appeal, type Judgment } from './types';

interface AppealSystemProps {
  caseId?: number;
  judgment?: Judgment;
  appeals?: Appeal[];
  maxAppeals?: number;
  appealWindow?: number;
  currentBlock?: number;
  onFileAppeal?: (caseId: number, appealRound: number, grounds: string) => void;
}

const statusConfig: Record<number, { label: string; color: string; icon: typeof Clock }> = {
  1: { label: 'Pending', color: 'yellow', icon: Clock },
  2: { label: 'Granted', color: 'green', icon: CheckCircle },
  3: { label: 'Denied', color: 'red', icon: XCircle },
};

export function AppealSystem({
  caseId,
  judgment,
  appeals = [],
  maxAppeals = 3,
  appealWindow = 1440,
  currentBlock = 0,
  onFileAppeal,
}: AppealSystemProps) {
  const [grounds, setGrounds] = useState('');
  const [filing, setFiling] = useState(false);

  const canAppeal = judgment
    && !judgment.finalized
    && appeals.length < maxAppeals
    && currentBlock <= judgment.issuedAt + appealWindow;

  const blocksRemaining = judgment
    ? Math.max(0, judgment.issuedAt + appealWindow - currentBlock)
    : 0;

  const handleFile = useCallback(() => {
    if (!caseId || !onFileAppeal || !grounds.trim()) return;
    setFiling(true);
    onFileAppeal(caseId, appeals.length + 1, grounds.trim());
    setTimeout(() => {
      setFiling(false);
      setGrounds('');
    }, 1000);
  }, [caseId, onFileAppeal, grounds, appeals.length]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-50 rounded-lg">
          <Scale className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Appeal System</h3>
          <p className="text-sm text-gray-500">
            {appeals.length} of {maxAppeals} appeals used
          </p>
        </div>
      </div>

      {judgment && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Current Judgment</p>
          <p className="text-sm font-medium text-gray-900">
            {OUTCOME_TYPES[judgment.outcome] || 'Unknown'}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-gray-500">
              Claimant: {(judgment.claimantAward / 1_000_000).toFixed(2)} STX
            </span>
            <span className="text-xs text-gray-500">
              Respondent: {(judgment.respondentAward / 1_000_000).toFixed(2)} STX
            </span>
          </div>
          {judgment.finalized && (
            <div className="mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Finalized</span>
            </div>
          )}
        </div>
      )}

      {appeals.length > 0 && (
        <div className="mb-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Appeal History</h4>
          {appeals.map((appeal) => {
            const config = statusConfig[appeal.status] || statusConfig[1];
            const Icon = config.icon;
            return (
              <div
                key={appeal.appealRound}
                className="p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    Round {appeal.appealRound}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-${config.color}-50 text-${config.color}-700`}>
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{appeal.grounds}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>Filed block {appeal.filedAt}</span>
                  {appeal.decidedAt > 0 && <span>Decided block {appeal.decidedAt}</span>}
                </div>
                {appeal.decisionReason && (
                  <p className="mt-2 text-xs text-gray-500 italic">{appeal.decisionReason}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canAppeal ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <p className="text-xs text-orange-700">
              {blocksRemaining} blocks remaining in appeal window
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grounds for Appeal
            </label>
            <textarea
              value={grounds}
              onChange={(e) => setGrounds(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Describe the grounds for your appeal..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{grounds.length}/500</p>
          </div>

          <button
            onClick={handleFile}
            disabled={filing || !grounds.trim()}
            className="w-full py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {filing ? 'Filing Appeal...' : `File Appeal (Round ${appeals.length + 1})`}
          </button>
        </div>
      ) : judgment && !judgment.finalized ? (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-600">
              {appeals.length >= maxAppeals
                ? 'Maximum appeal rounds reached'
                : 'Appeal window has closed'}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
