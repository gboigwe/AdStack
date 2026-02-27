'use client';

import { CheckCircle, Clock, AlertTriangle, ArrowRight, XCircle } from 'lucide-react';
import { DISPUTE_STATUS, type DisputeCase } from './types';

interface ResolutionTrackerProps {
  disputeCase?: DisputeCase;
}

const STEPS = [
  { status: 1, label: 'Filed', description: 'Dispute submitted' },
  { status: 2, label: 'Acknowledged', description: 'Respondent acknowledged' },
  { status: 3, label: 'Investigation', description: 'Under investigation' },
  { status: 4, label: 'Arbitration', description: 'Arbitrator assigned' },
  { status: 5, label: 'Resolved', description: 'Judgment issued' },
  { status: 7, label: 'Closed', description: 'Case finalized' },
];

export function ResolutionTracker({ disputeCase }: ResolutionTrackerProps) {
  if (!disputeCase) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <p className="text-center text-gray-400 py-4">No case to track</p>
      </div>
    );
  }

  const currentStatus = disputeCase.status;
  const isDismissed = currentStatus === 8;
  const isAppealed = currentStatus === 6;

  const getStepState = (stepStatus: number) => {
    if (isDismissed) return stepStatus <= 1 ? 'complete' : 'dismissed';
    if (stepStatus < currentStatus) return 'complete';
    if (stepStatus === currentStatus) return 'current';
    return 'upcoming';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <ArrowRight className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Resolution Progress</h3>
          <p className="text-sm text-gray-500">Case #{disputeCase.caseId}</p>
        </div>
      </div>

      {isDismissed && (
        <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5 text-gray-500" />
          <p className="text-sm font-medium text-gray-700">This case has been dismissed</p>
        </div>
      )}

      {isAppealed && (
        <div className="mb-6 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <p className="text-sm font-medium text-orange-700">This case is under appeal</p>
        </div>
      )}

      <div className="relative">
        {STEPS.map((step, idx) => {
          const state = getStepState(step.status);
          const isLast = idx === STEPS.length - 1;

          return (
            <div key={step.status} className="flex items-start gap-4 relative">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  state === 'complete'
                    ? 'bg-green-100 border-green-500'
                    : state === 'current'
                    ? 'bg-indigo-100 border-indigo-500'
                    : state === 'dismissed'
                    ? 'bg-gray-100 border-gray-300'
                    : 'bg-white border-gray-200'
                }`}>
                  {state === 'complete' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : state === 'current' ? (
                    <Clock className="w-4 h-4 text-indigo-600" />
                  ) : state === 'dismissed' ? (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 h-8 ${
                    state === 'complete' ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
              <div className="pb-8">
                <p className={`text-sm font-medium ${
                  state === 'complete'
                    ? 'text-green-700'
                    : state === 'current'
                    ? 'text-indigo-700'
                    : 'text-gray-400'
                }`}>
                  {step.label}
                </p>
                <p className={`text-xs ${
                  state === 'complete' || state === 'current' ? 'text-gray-500' : 'text-gray-300'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-2 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-500">Filed</p>
          <p className="text-sm font-medium text-gray-900">Block {disputeCase.filedAt}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">SLA Deadline</p>
          <p className="text-sm font-medium text-gray-900">Block {disputeCase.slaDeadline}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Last Activity</p>
          <p className="text-sm font-medium text-gray-900">Block {disputeCase.lastActivity}</p>
        </div>
      </div>
    </div>
  );
}
