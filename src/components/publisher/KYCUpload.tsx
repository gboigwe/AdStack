import React, { useState } from 'react';
import { useConnect } from '@stacks/connect-react';
import { bufferCV, uintCV, stringAsciiCV } from '@stacks/transactions';
import { gaiaStorage } from '../../lib/gaia-storage';

interface KYCDocument {
  type: 'passport' | 'drivers_license' | 'national_id' | 'proof_of_address';
  file: File | null;
  hash: string | null;
  uploaded: boolean;
}

interface KYCUploadProps {
  publisherId: number;
  onComplete?: () => void;
}

export const KYCUpload: React.FC<KYCUploadProps> = ({ publisherId, onComplete }) => {
  const { doContractCall } = useConnect();
  const [complianceLevel, setComplianceLevel] = useState<number>(1); // 1=Basic, 2=Standard, 3=Enhanced
  const [documents, setDocuments] = useState<Record<string, KYCDocument>>({
    identity: {
      type: 'passport',
      file: null,
      hash: null,
      uploaded: false
    },
    address: {
      type: 'proof_of_address',
      file: null,
      hash: null,
      uploaded: false
    }
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState('US');

  const complianceLevels = [
    {
      level: 1,
      name: 'Basic',
      description: 'Email verification only',
      requirements: ['Valid email address'],
      benefits: ['Access to basic features', 'Up to 10k impressions/month']
    },
    {
      level: 2,
      name: 'Standard',
      description: 'Identity verification',
      requirements: ['Government-issued ID', 'Proof of address'],
      benefits: ['Unlock verified badge', 'Up to 100k impressions/month', '5% higher revenue share']
    },
    {
      level: 3,
      name: 'Enhanced',
      description: 'Full KYC compliance',
      requirements: ['Enhanced due diligence', 'Business verification', 'Tax documentation'],
      benefits: ['Premium publisher status', 'Unlimited impressions', '10% higher revenue share', 'Priority support']
    }
  ];

  const handleFileSelect = async (docKey: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, and PDF files are allowed');
      return;
    }

    setDocuments(prev => ({
      ...prev,
      [docKey]: {
        ...prev[docKey],
        file
      }
    }));

    setError(null);
  };

  const calculateHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleUpload = async () => {
    setUploading(true);
    setError(null);

    try {
      // Upload documents to Gaia
      const uploadPromises = Object.entries(documents).map(async ([key, doc]) => {
        if (!doc.file) return;

        // Calculate document hash
        const hash = await calculateHash(doc.file);

        // Upload to Gaia (encrypted)
        const gaiaPath = `kyc/${publisherId}/${key}-${Date.now()}.pdf`;
        await gaiaStorage.uploadFile(doc.file, gaiaPath, { encrypt: true });

        return { key, hash };
      });

      const results = await Promise.all(uploadPromises);

      // Update document hashes
      const updatedDocs = { ...documents };
      results.forEach(result => {
        if (result) {
          updatedDocs[result.key] = {
            ...updatedDocs[result.key],
            hash: result.hash,
            uploaded: true
          };
        }
      });

      setDocuments(updatedDocs);

      // Submit KYC verification to contract
      const identityDoc = updatedDocs.identity;
      if (identityDoc.hash) {
        await submitKYCVerification(identityDoc.hash);
      }

      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submitKYCVerification = async (documentHash: string) => {
    const hashBuffer = Buffer.from(documentHash, 'hex');

    await doContractCall({
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'kyc-registry',
      functionName: 'submit-kyc-verification',
      functionArgs: [
        // user: principal (automatically tx-sender)
        uintCV(complianceLevel),
        bufferCV(hashBuffer),
        stringAsciiCV(countryCode),
        uintCV(0), // risk-score (0 = low)
        uintCV(365) // validity-days
      ],
      onFinish: (data) => {
        console.log('KYC submitted:', data);
      },
      onCancel: () => {
        setError('Transaction cancelled');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-2">KYC Verification</h2>
      <p className="text-gray-600 mb-6">
        Complete identity verification to unlock higher publisher tiers and benefits.
      </p>

      {/* Compliance Level Selection */}
      <div className="mb-8">
        <h3 className="font-semibold mb-4">Select Compliance Level</h3>
        <div className="grid grid-cols-3 gap-4">
          {complianceLevels.map((level) => (
            <button
              key={level.level}
              onClick={() => setComplianceLevel(level.level)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                complianceLevel === level.level
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold">{level.name}</h4>
                {complianceLevel === level.level && (
                  <span className="text-blue-600">✓</span>
                )}
              </div>
              <p className="text-xs text-gray-600 mb-3">{level.description}</p>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-700">Benefits:</p>
                {level.benefits.slice(0, 2).map((benefit, idx) => (
                  <p key={idx} className="text-xs text-gray-600">• {benefit}</p>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Document Upload (for Standard and Enhanced) */}
      {complianceLevel >= 2 && (
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="font-semibold mb-4">Upload Required Documents</h3>

          <div className="space-y-4">
            {/* Identity Document */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Government-Issued ID *
              </label>
              <select
                value={documents.identity.type}
                onChange={(e) => setDocuments(prev => ({
                  ...prev,
                  identity: { ...prev.identity, type: e.target.value as any }
                }))}
                className="mb-2 px-3 py-2 border rounded w-full max-w-xs"
              >
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's License</option>
                <option value="national_id">National ID Card</option>
              </select>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="identity-upload"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect('identity', file);
                  }}
                  className="hidden"
                />
                <label htmlFor="identity-upload" className="cursor-pointer">
                  {documents.identity.file ? (
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">
                        ✓ {documents.identity.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Click to change
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, PNG, or JPEG (max 10MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Proof of Address */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Proof of Address *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Utility bill, bank statement, or government document (within 3 months)
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="address-upload"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect('address', file);
                  }}
                  className="hidden"
                />
                <label htmlFor="address-upload" className="cursor-pointer">
                  {documents.address.file ? (
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">
                        ✓ {documents.address.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Click to change
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, PNG, or JPEG (max 10MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Country Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Country of Residence *
              </label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="px-3 py-2 border rounded w-full max-w-xs"
              >
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                {/* Add more countries as needed */}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-sm mb-2">🔒 Privacy & Security</h4>
        <ul className="text-xs text-gray-700 space-y-1">
          <li>• Documents are encrypted before upload</li>
          <li>• Only document hashes (not actual files) are stored on-chain</li>
          <li>• Your data is processed by authorized KYC verifiers only</li>
          <li>• Compliant with GDPR and data protection regulations</li>
        </ul>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Save as Draft
        </button>
        <button
          onClick={handleUpload}
          disabled={uploading || (complianceLevel >= 2 && (!documents.identity.file || !documents.address.file))}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
        >
          {uploading ? 'Uploading...' : 'Submit for Verification'}
        </button>
      </div>
    </div>
  );
};

export default KYCUpload;
