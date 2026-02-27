'use client';

import { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, Clock, FileText } from 'lucide-react';
import { CONSENT_PURPOSES, CONSENT_STATUS, type UserConsent } from './types';

interface ConsentItem {
  purpose: number;
  label: string;
  description: string;
  status: number;
  grantedAt: number;
}

export function PrivacySettingsUI() {
  const [consents, setConsents] = useState<ConsentItem[]>([
    {
      purpose: 1,
      label: 'Ad Targeting',
      description: 'Allow your anonymized profile to be used for relevant ad matching',
      status: 0,
      grantedAt: 0,
    },
    {
      purpose: 2,
      label: 'Analytics',
      description: 'Help improve platform performance through anonymized usage data',
      status: 0,
      grantedAt: 0,
    },
    {
      purpose: 3,
      label: 'Personalization',
      description: 'Personalize your dashboard and content recommendations',
      status: 0,
      grantedAt: 0,
    },
    {
      purpose: 4,
      label: 'Marketing Communications',
      description: 'Receive updates about new features and campaigns',
      status: 0,
      grantedAt: 0,
    },
    {
      purpose: 5,
      label: 'Performance Measurement',
      description: 'Allow campaign performance measurement and attribution',
      status: 0,
      grantedAt: 0,
    },
  ]);

  const [dataExportRequested, setDataExportRequested] = useState(false);
  const [erasureRequested, setErasureRequested] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const toggleConsent = (purpose: number) => {
    setConsents(
      consents.map((c) =>
        c.purpose === purpose
          ? { ...c, status: c.status === 1 ? 3 : 1, grantedAt: Date.now() }
          : c
      )
    );
  };

  const grantAll = () => {
    setConsents(consents.map((c) => ({ ...c, status: 1, grantedAt: Date.now() })));
  };

  const withdrawAll = () => {
    setConsents(consents.map((c) => ({ ...c, status: 3, grantedAt: Date.now() })));
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 3:
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1:
        return 'Granted';
      case 3:
        return 'Withdrawn';
      default:
        return 'Not set';
    }
  };

  const grantedCount = consents.filter((c) => c.status === 1).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Privacy Settings</h2>
            <p className="text-sm text-gray-500">Manage your data consent and privacy preferences</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={grantAll}
            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            Accept All
          </button>
          <button
            onClick={withdrawAll}
            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            Reject All
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {consents.map((consent) => (
          <div
            key={consent.purpose}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon(consent.status)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{consent.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    consent.status === 1
                      ? 'bg-green-100 text-green-700'
                      : consent.status === 3
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {getStatusLabel(consent.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{consent.description}</p>
              </div>
            </div>
            <button
              onClick={() => toggleConsent(consent.purpose)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                consent.status === 1 ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  consent.status === 1 ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Data Rights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setDataExportRequested(true)}
            disabled={dataExportRequested}
            className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-blue-500" />
            <div>
              <span className="text-sm font-medium text-gray-900 block">Export Data</span>
              <span className="text-xs text-gray-500">
                {dataExportRequested ? 'Request submitted' : 'Download your data'}
              </span>
            </div>
          </button>
          <button
            onClick={() => setErasureRequested(true)}
            disabled={erasureRequested}
            className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <div>
              <span className="text-sm font-medium text-gray-900 block">Delete Data</span>
              <span className="text-xs text-gray-500">
                {erasureRequested ? 'Erasure pending' : 'Request data erasure'}
              </span>
            </div>
          </button>
          <button
            onClick={() => setShowPolicyModal(true)}
            className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <Shield className="w-4 h-4 text-green-500" />
            <div>
              <span className="text-sm font-medium text-gray-900 block">Privacy Policy</span>
              <span className="text-xs text-gray-500">View current policy</span>
            </div>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500">
        <span>{grantedCount} of {consents.length} consents granted</span>
        <span>All data is processed on-chain with zero-knowledge proofs</span>
      </div>

      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Privacy Policy</h3>
              <button
                onClick={() => setShowPolicyModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                AdStack is committed to protecting your privacy. All targeting data is processed
                using zero-knowledge proofs, ensuring your personal information is never exposed
                to advertisers or third parties.
              </p>
              <h4 className="font-medium text-gray-900">Data Collection</h4>
              <p>
                We collect only the minimum data required for ad targeting. Your demographic
                information is hashed and stored on-chain. No raw personal data is shared
                with advertisers.
              </p>
              <h4 className="font-medium text-gray-900">Your Rights</h4>
              <p>
                Under GDPR and applicable regulations, you have the right to access, correct,
                export, and delete your data. You may withdraw consent at any time without
                affecting the lawfulness of prior processing.
              </p>
              <h4 className="font-medium text-gray-900">Data Retention</h4>
              <p>
                Consent records are maintained for audit compliance. Upon erasure request,
                all associated targeting data is removed within 30 days (approximately 4,320 blocks).
              </p>
            </div>
            <button
              onClick={() => setShowPolicyModal(false)}
              className="w-full mt-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
