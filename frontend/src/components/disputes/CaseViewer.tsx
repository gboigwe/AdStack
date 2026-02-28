'use client';

import { useState } from 'react';
import { Eye, Clock, AlertTriangle, User, Tag, Link2 } from 'lucide-react';
import {
  DISPUTE_STATUS,
  DISPUTE_TYPES,
  SEVERITY_LEVELS,
  PRIORITY_LEVELS,
  type DisputeCase,
  type CaseMetadata,
  type TimelineEntry,
  type CounterClaim,
  type SlaRecord,
} from './types';

interface CaseViewerProps {
  disputeCase?: DisputeCase;
  metadata?: CaseMetadata;
  timeline?: TimelineEntry[];
  counterClaim?: CounterClaim;
  slaRecord?: SlaRecord;
}

export function CaseViewer({
  disputeCase,
  metadata,
  timeline = [],
  counterClaim,
  slaRecord,
}: CaseViewerProps) {
  const [showTimeline, setShowTimeline] = useState(true);

  if (!disputeCase) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="text-center py-8">
          <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No case selected</p>
        </div>
      </div>
    );
  }

  const statusColor = (s: number) => {
    if (s === 5 || s === 7) return 'bg-green-50 text-green-700 border-green-200';
    if (s === 4 || s === 6) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (s === 8) return 'bg-gray-50 text-gray-700 border-gray-200';
    if (s === 3) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  };

  const severityBadge = (sev: number) => {
    if (sev === 4) return 'bg-red-100 text-red-800';
    if (sev === 3) return 'bg-orange-100 text-orange-800';
    if (sev === 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Case #{disputeCase.caseId}
              </h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(disputeCase.status)}`}>
                {DISPUTE_STATUS[disputeCase.status]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Campaign #{disputeCase.campaignId}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityBadge(disputeCase.severity)}`}>
              {SEVERITY_LEVELS[disputeCase.severity]}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
              {PRIORITY_LEVELS[disputeCase.priority]}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Claimant</p>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-mono text-gray-900 truncate">
                {disputeCase.claimant}
              </p>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Respondent</p>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-mono text-gray-900 truncate">
                {disputeCase.respondent}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xl font-bold text-gray-900">
              {(disputeCase.amountAtStake / 1000000).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">STX at Stake</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xl font-bold text-gray-900">
              {DISPUTE_TYPES[disputeCase.disputeType]}
            </p>
            <p className="text-xs text-gray-500">Type</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xl font-bold text-gray-900">
              {disputeCase.escalationCount}
            </p>
            <p className="text-xs text-gray-500">Escalations</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{disputeCase.description}</p>
        </div>

        {slaRecord && (
          <div className={`p-3 rounded-lg border ${slaRecord.breached ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${slaRecord.breached ? 'text-red-600' : 'text-green-600'}`} />
              <p className={`text-sm font-medium ${slaRecord.breached ? 'text-red-700' : 'text-green-700'}`}>
                SLA: {slaRecord.slaBlocks} blocks {slaRecord.breached ? '(BREACHED)' : '(Within limits)'}
              </p>
            </div>
          </div>
        )}

        {metadata && metadata.categoryTags.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <div className="flex flex-wrap gap-1">
              {metadata.categoryTags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {metadata?.relatedCaseId && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link2 className="w-4 h-4 text-gray-400" />
            Related to Case #{metadata.relatedCaseId}
          </div>
        )}

        {counterClaim && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="text-sm font-medium text-orange-800 mb-2">Counter-Claim Filed</h4>
            <p className="text-sm text-orange-700">{counterClaim.reason}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-orange-600">
              <span>Amount: {(counterClaim.amount / 1000000).toFixed(2)} STX</span>
              <span>{counterClaim.accepted ? 'Accepted' : 'Pending'}</span>
            </div>
          </div>
        )}

        <div>
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-3"
          >
            {showTimeline ? 'Hide' : 'Show'} Timeline ({timeline.length} entries)
          </button>

          {showTimeline && timeline.length > 0 && (
            <div className="space-y-3 border-l-2 border-gray-200 ml-2 pl-4">
              {timeline.map((entry, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 bg-gray-300 rounded-full border-2 border-white" />
                  <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                  <p className="text-xs text-gray-600">{entry.detail}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Block {entry.timestamp} | {entry.actor.substring(0, 10)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
