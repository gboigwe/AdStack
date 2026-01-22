'use client';

import { useState, useEffect } from 'react';
import { UserCheck, UserMinus, TrendingUp, AlertCircle } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';

interface DelegationInfo {
  hasDelegate: boolean;
  delegateTo: string | null;
  delegatedAt: number | null;
  votingPower: number;
  delegatedPower: number;
}

export function DelegationManager() {
  const { address, isConnected } = useWalletStore();
  const [delegationInfo, setDelegationInfo] = useState<DelegationInfo>({
    hasDelegate: false,
    delegateTo: null,
    delegatedAt: null,
    votingPower: 0,
    delegatedPower: 0,
  });
  const [delegateAddress, setDelegateAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isConnected && address) {
      loadDelegationInfo();
    }
  }, [isConnected, address]);

  const loadDelegationInfo = async () => {
    try {
      // TODO: Fetch delegation info from governance-token contract
      setDelegationInfo({
        hasDelegate: false,
        delegateTo: null,
        delegatedAt: null,
        votingPower: 150000000000, // 150k tokens
        delegatedPower: 0,
      });
    } catch (error) {
      console.error('Failed to load delegation info:', error);
    }
  };

  const handleDelegate = async () => {
    if (!delegateAddress.trim()) {
      setError('Please enter a delegate address');
      return;
    }

    if (delegateAddress === address) {
      setError('Cannot delegate to yourself');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Call governance-token contract to delegate
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSuccess('Successfully delegated voting power');
      setDelegateAddress('');
      await loadDelegationInfo();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to delegate voting power');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Call governance-token contract to revoke delegation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSuccess('Successfully revoked delegation');
      await loadDelegationInfo();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to revoke delegation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTokens = (microTokens: number): string => {
    return (microTokens / 1000000).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const shortenAddress = (addr: string): string => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
  };

  if (!isConnected) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Wallet</h2>
          <p className="text-gray-600">Connect your wallet to manage vote delegation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vote Delegation</h1>
        <p className="text-gray-600">Delegate your voting power to another address</p>
      </div>

      {/* Voting Power Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Your Voting Power</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatTokens(delegationInfo.votingPower)}
          </p>
          <p className="text-xs text-gray-500 mt-1">ADSGOV tokens</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Delegated to You</span>
            <UserCheck className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatTokens(delegationInfo.delegatedPower)}
          </p>
          <p className="text-xs text-gray-500 mt-1">ADSGOV tokens</p>
        </div>
      </div>

      {/* Current Delegation Status */}
      {delegationInfo.hasDelegate && delegationInfo.delegateTo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Currently Delegated</h3>
              <p className="text-sm text-blue-800 mb-1">
                Your voting power is delegated to:
              </p>
              <p className="text-sm font-mono text-blue-900 mb-3">
                {delegationInfo.delegateTo}
              </p>
              {delegationInfo.delegatedAt && (
                <p className="text-xs text-blue-700">
                  Delegated at block: {delegationInfo.delegatedAt}
                </p>
              )}
            </div>
            <button
              onClick={handleRevoke}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <UserMinus className="w-4 h-4" />
              Revoke
            </button>
          </div>
        </div>
      )}

      {/* Delegation Form */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {delegationInfo.hasDelegate ? 'Change Delegate' : 'Delegate Voting Power'}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="delegateAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Delegate Address
            </label>
            <input
              type="text"
              id="delegateAddress"
              value={delegateAddress}
              onChange={(e) => setDelegateAddress(e.target.value)}
              placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-2 text-xs text-gray-500">
              Enter the Stacks address of the person you want to delegate your voting power to
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <button
            onClick={handleDelegate}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <UserCheck className="w-5 h-5" />
                Delegate Voting Power
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="text-sm font-semibold text-yellow-900 mb-2">About Delegation</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Delegating your voting power allows another address to vote on your behalf</li>
          <li>• You retain ownership of your tokens at all times</li>
          <li>• You can revoke delegation at any time</li>
          <li>• Delegated voting power is counted for proposal quorum</li>
          <li>• You cannot vote directly while your power is delegated</li>
        </ul>
      </div>
    </div>
  );
}
