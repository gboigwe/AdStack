import React, { useEffect, useState } from 'react';
import { cvToValue, callReadOnlyFunction } from '@stacks/transactions';

interface VerificationStatusProps {
  publisherId: number;
  userAddress: string;
}

interface PublisherData {
  tier: number;
  stakeAmount: number;
  domainVerified: boolean;
  trafficVerified: boolean;
  monthlyTraffic: number;
  active: boolean;
}

interface KYCData {
  complianceLevel: number;
  status: string;
  expiresAt: number;
  riskScore: number;
}

interface ReputationData {
  score: number;
  tier: number;
  totalCampaigns: number;
  successRate: number;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  publisherId,
  userAddress
}) => {
  const [publisherData, setPublisherData] = useState<PublisherData | null>(null);
  const [kycData, setKYCData] = useState<KYCData | null>(null);
  const [reputationData, setReputationData] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);

  const tierNames = ['Unverified', 'Basic', 'Verified', 'Premium'];
  const complianceLevels = ['None', 'Basic', 'Standard', 'Enhanced'];
  const reputationTiers = ['Novice', 'Bronze', 'Silver', 'Gold', 'Platinum'];

  useEffect(() => {
    loadVerificationStatus();
  }, [publisherId, userAddress]);

  const loadVerificationStatus = async () => {
    setLoading(true);

    try {
      // Load publisher data
      const publisherResult = await callReadOnlyFunction({
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        contractName: 'publisher-verification',
        functionName: 'get-publisher',
        functionArgs: [],
        senderAddress: userAddress,
        network: 'testnet'
      });

      if (publisherResult) {
        const publisher = cvToValue(publisherResult);
        setPublisherData(publisher);
      }

      // Load KYC data
      const kycResult = await callReadOnlyFunction({
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        contractName: 'kyc-registry',
        functionName: 'get-kyc-record',
        functionArgs: [],
        senderAddress: userAddress,
        network: 'testnet'
      });

      if (kycResult) {
        const kyc = cvToValue(kycResult);
        setKYCData(kyc);
      }

      // Load reputation data
      const reputationResult = await callReadOnlyFunction({
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        contractName: 'publisher-reputation',
        functionName: 'get-reputation',
        functionArgs: [],
        senderAddress: userAddress,
        network: 'testnet'
      });

      if (reputationResult) {
        const reputation = cvToValue(reputationResult);
        setReputationData(reputation);
      }
    } catch (err) {
      console.error('Failed to load verification status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (verified: boolean) => {
    return verified ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50';
  };

  const getStatusIcon = (verified: boolean) => {
    return verified ? '✓' : '⚠';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Verification Status</h2>
        <p className="text-gray-600">
          Track your verification progress and unlock higher publisher tiers.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Publisher Tier */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Publisher Tier</h3>
            <span className="text-2xl">🏆</span>
          </div>
          <div className="text-3xl font-bold mb-2">
            {tierNames[publisherData?.tier || 0]}
          </div>
          <div className="text-sm text-gray-600">
            {publisherData?.stakeAmount
              ? `${publisherData.stakeAmount / 1000000} STX staked`
              : 'No stake yet'}
          </div>
        </div>

        {/* KYC Status */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">KYC Status</h3>
            <span className="text-2xl">🔐</span>
          </div>
          <div className="text-3xl font-bold mb-2">
            {complianceLevels[kycData?.complianceLevel || 0]}
          </div>
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            kycData?.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {kycData?.status || 'Not Started'}
          </div>
        </div>

        {/* Reputation Score */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Reputation</h3>
            <span className="text-2xl">⭐</span>
          </div>
          <div className="text-3xl font-bold mb-2">
            {reputationData?.score || 0}
          </div>
          <div className="text-sm text-gray-600">
            {reputationTiers[reputationData?.tier || 0]} Tier
          </div>
        </div>
      </div>

      {/* Verification Checklist */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="font-semibold mb-4">Verification Checklist</h3>
        <div className="space-y-3">
          {/* Domain Verification */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <span className={`text-2xl ${publisherData?.domainVerified ? 'opacity-100' : 'opacity-30'}`}>
                {getStatusIcon(publisherData?.domainVerified || false)}
              </span>
              <div>
                <h4 className="font-medium">Domain Verified</h4>
                <p className="text-sm text-gray-600">
                  Prove ownership of your domain
                </p>
              </div>
            </div>
            {publisherData?.domainVerified ? (
              <span className="text-green-600 font-semibold">Complete</span>
            ) : (
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                Verify Now
              </button>
            )}
          </div>

          {/* Traffic Verification */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <span className={`text-2xl ${publisherData?.trafficVerified ? 'opacity-100' : 'opacity-30'}`}>
                {getStatusIcon(publisherData?.trafficVerified || false)}
              </span>
              <div>
                <h4 className="font-medium">Traffic Verified</h4>
                <p className="text-sm text-gray-600">
                  Current: {publisherData?.monthlyTraffic?.toLocaleString() || 0} views/month
                </p>
              </div>
            </div>
            {publisherData?.trafficVerified ? (
              <span className="text-green-600 font-semibold">Complete</span>
            ) : (
              <button className="px-4 py-2 border rounded hover:bg-gray-50 text-sm">
                Submit Traffic Data
              </button>
            )}
          </div>

          {/* KYC Verification */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <span className={`text-2xl ${kycData?.status === 'verified' ? 'opacity-100' : 'opacity-30'}`}>
                {getStatusIcon(kycData?.status === 'verified')}
              </span>
              <div>
                <h4 className="font-medium">KYC Completed</h4>
                <p className="text-sm text-gray-600">
                  Level: {complianceLevels[kycData?.complianceLevel || 0]}
                </p>
              </div>
            </div>
            {kycData?.status === 'verified' ? (
              <span className="text-green-600 font-semibold">Complete</span>
            ) : (
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                Start KYC
              </button>
            )}
          </div>

          {/* Stake Requirement */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <span className={`text-2xl ${(publisherData?.stakeAmount || 0) > 0 ? 'opacity-100' : 'opacity-30'}`}>
                {getStatusIcon((publisherData?.stakeAmount || 0) > 0)}
              </span>
              <div>
                <h4 className="font-medium">Stake Deposited</h4>
                <p className="text-sm text-gray-600">
                  Required: 1,000 STX minimum for Basic tier
                </p>
              </div>
            </div>
            {(publisherData?.stakeAmount || 0) > 0 ? (
              <span className="text-green-600 font-semibold">
                {(publisherData?.stakeAmount || 0) / 1000000} STX
              </span>
            ) : (
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                Stake Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {reputationData && reputationData.totalCampaigns > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{reputationData.totalCampaigns}</div>
              <div className="text-sm text-gray-600">Total Campaigns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{reputationData.successRate}%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{reputationData.score}</div>
              <div className="text-sm text-gray-600">Reputation Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {reputationTiers[reputationData.tier]}
              </div>
              <div className="text-sm text-gray-600">Reputation Tier</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationStatus;
