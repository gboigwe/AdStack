/**
 * Complete Publisher Verification Flow Example
 *
 * This example demonstrates the full publisher onboarding and verification workflow,
 * including domain verification, KYC upload, and reputation tracking.
 */

import React, { useState, useEffect } from 'react';
import { useConnect } from '@stacks/connect-react';
import { StacksTestnet } from '@stacks/network';
import {
  PublisherOnboarding,
  DomainVerification,
  KYCUpload,
  VerificationStatus,
  ReputationBadge
} from '../src/components/publisher';
import {
  registerPublisher,
  getPublisherByAddress,
  getKYCRecord,
  getReputation
} from '../src/lib/publisher-contracts';

const network = new StacksTestnet();

export const PublisherVerificationFlowExample: React.FC = () => {
  const { userSession, doContractCall } = useConnect();
  const [currentStep, setCurrentStep] = useState<'onboard' | 'verify' | 'kyc' | 'dashboard'>('onboard');
  const [publisherId, setPublisherId] = useState<number | null>(null);
  const [domain, setDomain] = useState<string>('');
  const [publisherData, setPublisherData] = useState<any>(null);
  const [kycData, setKYCData] = useState<any>(null);
  const [reputationData, setReputationData] = useState<any>(null);

  const userAddress = userSession?.loadUserData()?.profile?.stxAddress?.testnet || '';

  // Load publisher data when address is available
  useEffect(() => {
    if (userAddress) {
      loadPublisherData();
    }
  }, [userAddress]);

  const loadPublisherData = async () => {
    try {
      // Get publisher info
      const publisher = await getPublisherByAddress(userAddress, network);
      if (publisher) {
        setPublisherData(publisher);
        setPublisherId(publisher.publisherId);
      }

      // Get KYC status
      const kyc = await getKYCRecord(userAddress, network);
      if (kyc) {
        setKYCData(kyc);
      }

      // Get reputation
      const reputation = await getReputation(userAddress, network);
      if (reputation) {
        setReputationData(reputation);
      }
    } catch (error) {
      console.error('Failed to load publisher data:', error);
    }
  };

  const handleOnboardingComplete = async (completedPublisherId: number, publisherDomain: string) => {
    setPublisherId(completedPublisherId);
    setDomain(publisherDomain);
    setCurrentStep('verify');
  };

  const handleDomainVerified = () => {
    setCurrentStep('kyc');
  };

  const handleKYCComplete = () => {
    setCurrentStep('dashboard');
    loadPublisherData(); // Refresh data
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'onboard':
        return (
          <div>
            <h1 className="text-3xl font-bold mb-6">Publisher Onboarding</h1>
            <PublisherOnboarding />
            {/* Simulate completion for demo */}
            <button
              onClick={() => handleOnboardingComplete(1, 'example.com')}
              className="mt-4 px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              (Demo) Skip to Domain Verification
            </button>
          </div>
        );

      case 'verify':
        return (
          <div>
            <h1 className="text-3xl font-bold mb-6">Domain Verification</h1>
            {publisherId && domain && (
              <DomainVerification
                publisherId={publisherId}
                domain={domain}
                onVerified={handleDomainVerified}
              />
            )}
            <button
              onClick={() => setCurrentStep('kyc')}
              className="mt-4 px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              (Demo) Skip to KYC
            </button>
          </div>
        );

      case 'kyc':
        return (
          <div>
            <h1 className="text-3xl font-bold mb-6">KYC Verification</h1>
            {publisherId && (
              <KYCUpload
                publisherId={publisherId}
                onComplete={handleKYCComplete}
              />
            )}
            <button
              onClick={() => setCurrentStep('dashboard')}
              className="mt-4 px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              (Demo) Skip to Dashboard
            </button>
          </div>
        );

      case 'dashboard':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Publisher Dashboard</h1>
              {reputationData && (
                <ReputationBadge
                  score={reputationData.reputationScore}
                  tier={reputationData.tier}
                  size="lg"
                />
              )}
            </div>

            {publisherId && (
              <VerificationStatus
                publisherId={publisherId}
                userAddress={userAddress}
              />
            )}

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-sm text-gray-600 mb-2">Publisher Tier</h3>
                <p className="text-2xl font-bold">
                  {publisherData?.tier === 0 && 'Unverified'}
                  {publisherData?.tier === 1 && 'Basic'}
                  {publisherData?.tier === 2 && 'Verified'}
                  {publisherData?.tier === 3 && 'Premium'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-sm text-gray-600 mb-2">KYC Status</h3>
                <p className="text-2xl font-bold">
                  {kycData?.status || 'Not Started'}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-sm text-gray-600 mb-2">Reputation Score</h3>
                <p className="text-2xl font-bold">
                  {reputationData?.reputationScore || 0}
                </p>
              </div>
            </div>

            {/* Reputation Badge with Details */}
            {reputationData && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Reputation Details</h2>
                <ReputationBadge
                  score={reputationData.reputationScore}
                  tier={reputationData.tier}
                  showDetails={true}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setCurrentStep('verify')}
                className="px-6 py-2 border rounded hover:bg-gray-50"
              >
                Re-verify Domain
              </button>
              <button
                onClick={() => setCurrentStep('kyc')}
                className="px-6 py-2 border rounded hover:bg-gray-50"
              >
                Update KYC
              </button>
              <button
                onClick={loadPublisherData}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh Data
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Progress Indicator */}
        <div className="mb-8 bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentStep('onboard')}
              className={`px-4 py-2 rounded ${
                currentStep === 'onboard' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              1. Onboarding
            </button>
            <div className="flex-1 h-1 mx-2 bg-gray-200" />
            <button
              onClick={() => setCurrentStep('verify')}
              className={`px-4 py-2 rounded ${
                currentStep === 'verify' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              2. Domain
            </button>
            <div className="flex-1 h-1 mx-2 bg-gray-200" />
            <button
              onClick={() => setCurrentStep('kyc')}
              className={`px-4 py-2 rounded ${
                currentStep === 'kyc' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              3. KYC
            </button>
            <div className="flex-1 h-1 mx-2 bg-gray-200" />
            <button
              onClick={() => setCurrentStep('dashboard')}
              className={`px-4 py-2 rounded ${
                currentStep === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              4. Dashboard
            </button>
          </div>
        </div>

        {/* Current Step Content */}
        <div className="bg-white rounded-lg shadow p-8">
          {renderStep()}
        </div>

        {/* Developer Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold mb-2">Developer Info</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p>Current Step: <code>{currentStep}</code></p>
            <p>Publisher ID: <code>{publisherId || 'Not registered'}</code></p>
            <p>Domain: <code>{domain || 'Not set'}</code></p>
            <p>User Address: <code className="break-all">{userAddress || 'Not connected'}</code></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublisherVerificationFlowExample;
