import React, { useState } from 'react';
import { useConnect } from '@stacks/connect-react';
import { stringAsciiCV, uintCV } from '@stacks/transactions';
import { openContractCall } from '@leather-wallet/connect';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export const PublisherOnboarding: React.FC = () => {
  const { doContractCall } = useConnect();
  const [currentStep, setCurrentStep] = useState(0);
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publisherId, setPublisherId] = useState<number | null>(null);

  const steps: OnboardingStep[] = [
    {
      id: 0,
      title: 'Welcome',
      description: 'Join AdStack as a verified publisher',
      completed: false
    },
    {
      id: 1,
      title: 'Register Domain',
      description: 'Enter your domain to begin verification',
      completed: false
    },
    {
      id: 2,
      title: 'Verify Ownership',
      description: 'Prove you own the domain',
      completed: false
    },
    {
      id: 3,
      title: 'Complete KYC',
      description: 'Complete identity verification',
      completed: false
    }
  ];

  const handleRegisterPublisher = async () => {
    if (!domain) {
      setError('Please enter a domain');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await doContractCall({
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Replace with actual
        contractName: 'publisher-verification',
        functionName: 'register-publisher',
        functionArgs: [stringAsciiCV(domain)],
        onFinish: (data) => {
          console.log('Publisher registered:', data);
          setCurrentStep(2);
          // Extract publisher ID from response
          setPublisherId(1); // TODO: Parse from contract response
        },
        onCancel: () => {
          setError('Transaction cancelled');
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Welcome to AdStack Publisher Network</h2>
            <p className="text-gray-600">
              Join our decentralized advertising network and monetize your content with transparency and control.
            </p>
            <div className="grid grid-cols-3 gap-4 my-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Transparent Payouts</h3>
                <p className="text-sm text-gray-600">Automated on-chain settlements</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Tier-Based Benefits</h3>
                <p className="text-sm text-gray-600">Unlock rewards as you grow</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Fraud Protection</h3>
                <p className="text-sm text-gray-600">Staking ensures quality</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Get Started
            </button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Register Your Domain</h2>
            <p className="text-gray-600">
              Enter the domain you want to register as a publisher. You'll need to verify ownership in the next step.
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">Domain Name</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Do not include http:// or https://
              </p>
            </div>
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(0)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleRegisterPublisher}
                disabled={loading || !domain}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register Domain'}
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Verify Domain Ownership</h2>
            <p className="text-gray-600">
              To verify you own {domain}, choose one of the following methods:
            </p>
            <div className="space-y-3">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">DNS TXT Record</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Add this TXT record to your DNS settings:
                </p>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                  adstack-verify=verify-{publisherId || 'xxxxx'}
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">HTML Meta Tag</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Add this meta tag to your homepage:
                </p>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                  {`<meta name="adstack-verification" content="verify-${publisherId || 'xxxxx'}" />`}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Verify & Continue
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Complete KYC Verification</h2>
            <p className="text-gray-600">
              To access higher tiers and unlock premium features, complete KYC verification.
            </p>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm">
                Your data is stored securely using privacy-preserving methods. Only document hashes are stored on-chain.
              </p>
            </div>
            <div className="space-y-3">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">Basic Tier</h3>
                <p className="text-sm text-gray-600">Email verification only</p>
                <button className="mt-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                  Skip for Now
                </button>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">Verified Tier</h3>
                <p className="text-sm text-gray-600">Upload ID document</p>
                <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                  Upload Documents
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => alert('Onboarding complete!')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Complete Onboarding
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex-1">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
              <p className="text-xs mt-1 text-gray-600">{step.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {renderStepContent()}
      </div>
    </div>
  );
};

export default PublisherOnboarding;
