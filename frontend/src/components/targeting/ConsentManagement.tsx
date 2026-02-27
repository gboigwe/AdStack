'use client';

import { useState } from 'react';
import { ClipboardCheck, Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { CONSENT_PURPOSES, type UserConsent } from './types';

interface ConsentRecord {
  id: number;
  purpose: number;
  action: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
}

export function ConsentManagement() {
  const [activeConsents, setActiveConsents] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: false,
    4: false,
    5: true,
  });

  const [history] = useState<ConsentRecord[]>([
    { id: 1, purpose: 1, action: 'granted', previousStatus: 'none', newStatus: 'granted', timestamp: '2026-02-25T10:30:00Z' },
    { id: 2, purpose: 2, action: 'granted', previousStatus: 'none', newStatus: 'granted', timestamp: '2026-02-25T10:30:05Z' },
    { id: 3, purpose: 5, action: 'granted', previousStatus: 'none', newStatus: 'granted', timestamp: '2026-02-25T10:30:10Z' },
    { id: 4, purpose: 3, action: 'denied', previousStatus: 'none', newStatus: 'denied', timestamp: '2026-02-25T10:30:15Z' },
    { id: 5, purpose: 4, action: 'denied', previousStatus: 'none', newStatus: 'denied', timestamp: '2026-02-25T10:30:20Z' },
  ]);

  const [showHistory, setShowHistory] = useState(false);

  const toggleConsent = (purpose: number) => {
    setActiveConsents((prev) => ({ ...prev, [purpose]: !prev[purpose] }));
  };

  const grantedCount = Object.values(activeConsents).filter(Boolean).length;
  const totalPurposes = Object.keys(CONSENT_PURPOSES).length;

  const getActionColor = (action: string) => {
    switch (action) {
      case 'granted': return 'text-green-600 bg-green-50';
      case 'denied': return 'text-red-600 bg-red-50';
      case 'withdrawn': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-50 rounded-lg">
            <ClipboardCheck className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Consent Management</h2>
            <p className="text-sm text-gray-500">Track and manage user data processing consents</p>
          </div>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Clock className="w-3.5 h-3.5" />
          {showHistory ? 'Hide' : 'Show'} History
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900">Consent Coverage</span>
            <span className="text-xs text-gray-500">{grantedCount}/{totalPurposes} purposes</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all"
              style={{ width: `${(grantedCount / totalPurposes) * 100}%` }}
            />
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-teal-600">
            {Math.round((grantedCount / totalPurposes) * 100)}%
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-5">
        {Object.entries(CONSENT_PURPOSES).map(([key, label]) => {
          const purpose = parseInt(key);
          const isActive = activeConsents[purpose] || false;
          return (
            <div
              key={purpose}
              className="flex items-center justify-between p-3 border border-gray-100 rounded-lg"
            >
              <div className="flex items-center gap-2">
                {isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-300" />
                )}
                <span className="text-sm text-gray-900">{label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => toggleConsent(purpose)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${
                    isActive ? 'bg-teal-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      isActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showHistory && (
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Consent History</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {history.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded font-medium ${getActionColor(record.action)}`}>
                    {record.action}
                  </span>
                  <span className="text-gray-700">
                    {CONSENT_PURPOSES[record.purpose as keyof typeof CONSENT_PURPOSES]}
                  </span>
                </div>
                <span className="text-gray-400">
                  {new Date(record.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
