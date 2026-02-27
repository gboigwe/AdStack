'use client';

import { useState, useCallback } from 'react';
import { Upload, Shield, FileCheck, Lock, Trash2 } from 'lucide-react';
import {
  EVIDENCE_TYPES,
  ACCESS_LEVELS,
  type EvidenceItem,
  type CaseEvidenceSummary,
} from './types';

interface EvidenceUploadProps {
  caseId: number;
  existingEvidence?: EvidenceItem[];
  summary?: CaseEvidenceSummary;
  sealed?: boolean;
  onUpload?: (data: {
    caseId: number;
    evidenceType: number;
    contentHash: string;
    encryptionKeyHash: string;
    ipfsCid: string;
    fileSize: number;
    description: string;
    accessLevel: number;
  }) => void;
}

export function EvidenceUpload({
  caseId,
  existingEvidence = [],
  summary,
  sealed = false,
  onUpload,
}: EvidenceUploadProps) {
  const [evidenceType, setEvidenceType] = useState(1);
  const [description, setDescription] = useState('');
  const [ipfsCid, setIpfsCid] = useState('');
  const [contentHash, setContentHash] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [accessLevel, setAccessLevel] = useState(1);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = useCallback(() => {
    if (!ipfsCid || !contentHash || !description) return;
    setUploading(true);
    onUpload?.({
      caseId,
      evidenceType,
      contentHash,
      encryptionKeyHash: contentHash,
      ipfsCid,
      fileSize: parseInt(fileSize) || 0,
      description,
      accessLevel,
    });
    setUploading(false);
    setDescription('');
    setIpfsCid('');
    setContentHash('');
    setFileSize('');
  }, [caseId, evidenceType, contentHash, ipfsCid, fileSize, description, accessLevel, onUpload]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Upload className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Evidence Submission</h3>
          <p className="text-sm text-gray-500">Case #{caseId} - Upload supporting evidence</p>
        </div>
        {sealed && (
          <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
            <Lock className="w-3 h-3" /> Sealed
          </span>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {summary.documents + summary.screenshots + summary.transactions + summary.communications + summary.analyticsData + summary.witnessStatements}
            </p>
            <p className="text-xs text-gray-500">Total Items</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{formatBytes(summary.totalSize)}</p>
            <p className="text-xs text-gray-500">Total Size</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{summary.documents}</p>
            <p className="text-xs text-gray-500">Documents</p>
          </div>
        </div>
      )}

      {!sealed && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Type</label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(EVIDENCE_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(ACCESS_LEVELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IPFS CID</label>
            <input
              type="text"
              value={ipfsCid}
              onChange={(e) => setIpfsCid(e.target.value)}
              placeholder="Qm..."
              maxLength={64}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Hash</label>
              <input
                type="text"
                value={contentHash}
                onChange={(e) => setContentHash(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Size (bytes)</label>
              <input
                type="number"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Describe this evidence..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={uploading || !ipfsCid || !contentHash || !description}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Shield className="w-4 h-4" />
            {uploading ? 'Submitting...' : 'Submit Evidence'}
          </button>
        </div>
      )}

      {existingEvidence.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Submitted Evidence</h4>
          <div className="space-y-2">
            {existingEvidence.map((ev) => (
              <div
                key={ev.evidenceId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileCheck className={`w-4 h-4 ${ev.verified ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {EVIDENCE_TYPES[ev.evidenceType]} #{ev.evidenceId}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ev.ipfsCid.substring(0, 16)}... | {formatBytes(ev.fileSize)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ev.verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                      Verified
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{ACCESS_LEVELS[ev.accessLevel]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
