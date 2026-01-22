'use client';

import { useState, useEffect } from 'react';
import { Vote, Clock, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';

interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  passedProposals: number;
  votingPower: number;
  participation: number;
}

interface Proposal {
  id: number;
  title: string;
  description: string;
  state: number;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  startBlock: number;
  endBlock: number;
  proposer: string;
}

export function GovernanceDashboard() {
  const { address, isConnected } = useWalletStore();
  const [stats, setStats] = useState<GovernanceStats>({
    totalProposals: 0,
    activeProposals: 0,
    passedProposals: 0,
    votingPower: 0,
    participation: 0,
  });
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      loadGovernanceData();
    }
  }, [isConnected, address]);

  const loadGovernanceData = async () => {
    try {
      setLoading(true);
      // TODO: Fetch governance stats from smart contract
      // Placeholder data for now
      setStats({
        totalProposals: 12,
        activeProposals: 3,
        passedProposals: 7,
        votingPower: 150000,
        participation: 68,
      });

      // TODO: Fetch active proposals
      setProposals([]);
    } catch (error) {
      console.error('Failed to load governance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStateLabel = (state: number): string => {
    const states = ['Pending', 'Active', 'Succeeded', 'Defeated', 'Executed', 'Cancelled'];
    return states[state] || 'Unknown';
  };

  const getStateColor = (state: number): string => {
    switch (state) {
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-green-100 text-green-800';
      case 3: return 'bg-red-100 text-red-800';
      case 4: return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Wallet</h2>
          <p className="text-gray-600">Connect your wallet to participate in governance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Governance Dashboard</h1>
        <p className="text-gray-600">Participate in AdStack protocol governance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Proposals</span>
            <Vote className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalProposals}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Active Now</span>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeProposals}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Passed</span>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.passedProposals}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Your Voting Power</span>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {(stats.votingPower / 1000000).toFixed(2)}K
          </p>
        </div>
      </div>

      {/* Active Proposals */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Active Proposals</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading proposals...</p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-12">
              <Vote className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No active proposals</p>
              <p className="text-gray-500 text-sm mt-2">Create the first proposal to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <div key={proposal.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {proposal.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {proposal.description}
                      </p>
                    </div>
                    <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${getStateColor(proposal.state)}`}>
                      {getStateLabel(proposal.state)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">For</p>
                      <p className="text-sm font-semibold text-green-600">
                        {(proposal.forVotes / 1000000).toFixed(2)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Against</p>
                      <p className="text-sm font-semibold text-red-600">
                        {(proposal.againstVotes / 1000000).toFixed(2)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Abstain</p>
                      <p className="text-sm font-semibold text-gray-600">
                        {(proposal.abstainVotes / 1000000).toFixed(2)}K
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
