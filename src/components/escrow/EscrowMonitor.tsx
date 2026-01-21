'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/store/wallet-store';
import {
  type Escrow,
  getEscrowStatus,
  calculateEscrowProgress,
  canReleaseEscrow,
  formatEscrowAmount,
  releaseEscrow,
  partialRelease,
  approveRelease,
  cancelEscrow
} from '@/lib/contracts/escrow-vault';
import { getStacksNetwork } from '@/lib/stacks-config';

interface EscrowWithDetails extends Escrow {
  campaignName: string;
  status: string;
  progress: number;
  canRelease: boolean;
}

export default function EscrowMonitor({ campaignId }: { campaignId?: number }) {
  const { address, isConnected } = useWallet();
  const [escrows, setEscrows] = useState<EscrowWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowWithDetails | null>(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadEscrows();

      // Refresh every 30 seconds
      const interval = setInterval(loadEscrows, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address, campaignId]);

  const loadEscrows = async () => {
    try {
      // TODO: Fetch escrows from contract
      // For now, using mock data
      const mockEscrows: Escrow[] = [
        {
          escrowId: 1,
          campaignId: 1,
          beneficiary: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
          amount: 5000000000n,
          releasedAmount: 2000000000n,
          timeLock: Math.floor(Date.now() / 1000) - 3600,
          performanceThreshold: 80,
          expiresAt: Math.floor(Date.now() / 1000) + 2592000,
          released: false,
          cancelled: false,
          approvalCount: 2,
          requiredApprovers: ['SP...1', 'SP...2', 'SP...3'],
          createdAt: Math.floor(Date.now() / 1000) - 86400
        },
        {
          escrowId: 2,
          campaignId: 1,
          beneficiary: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
          amount: 3000000000n,
          releasedAmount: 0n,
          timeLock: Math.floor(Date.now() / 1000) + 3600,
          performanceThreshold: 75,
          expiresAt: Math.floor(Date.now() / 1000) + 1728000,
          released: false,
          cancelled: false,
          approvalCount: 1,
          requiredApprovers: ['SP...1', 'SP...2'],
          createdAt: Math.floor(Date.now() / 1000) - 43200
        }
      ];

      const enrichedEscrows: EscrowWithDetails[] = mockEscrows
        .filter(e => !campaignId || e.campaignId === campaignId)
        .map(escrow => ({
          ...escrow,
          campaignName: `Campaign #${escrow.campaignId}`,
          status: getEscrowStatus(escrow),
          progress: calculateEscrowProgress(escrow),
          canRelease: canReleaseEscrow(escrow)
        }));

      setEscrows(enrichedEscrows);
      setLoading(false);
    } catch (error) {
      console.error('Error loading escrows:', error);
      setLoading(false);
    }
  };

  const handleRelease = async (escrowId: number) => {
    if (!address) return;
    setActionLoading(true);

    try {
      await releaseEscrow({
        escrowId,
        network: getStacksNetwork(),
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
        onFinish: () => {
          console.log('Escrow released successfully');
          loadEscrows();
          setActionLoading(false);
          setSelectedEscrow(null);
        },
        onCancel: () => {
          setActionLoading(false);
        }
      });
    } catch (error) {
      console.error('Error releasing escrow:', error);
      setActionLoading(false);
    }
  };

  const handlePartialRelease = async (escrowId: number) => {
    if (!address || !partialAmount) return;
    setActionLoading(true);

    try {
      const amountMicroStx = BigInt(Math.floor(parseFloat(partialAmount) * 1_000_000));

      await partialRelease({
        escrowId,
        amount: amountMicroStx,
        network: getStacksNetwork(),
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
        onFinish: () => {
          console.log('Partial release successful');
          loadEscrows();
          setActionLoading(false);
          setPartialAmount('');
        },
        onCancel: () => {
          setActionLoading(false);
        }
      });
    } catch (error) {
      console.error('Error with partial release:', error);
      setActionLoading(false);
    }
  };

  const handleApprove = async (escrowId: number) => {
    if (!address) return;
    setActionLoading(true);

    try {
      await approveRelease({
        escrowId,
        network: getStacksNetwork(),
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
        onFinish: () => {
          console.log('Approval recorded successfully');
          loadEscrows();
          setActionLoading(false);
        },
        onCancel: () => {
          setActionLoading(false);
        }
      });
    } catch (error) {
      console.error('Error approving release:', error);
      setActionLoading(false);
    }
  };

  const handleCancel = async (escrowId: number) => {
    if (!address) return;
    if (!confirm('Are you sure you want to cancel this escrow? This action cannot be undone.')) return;

    setActionLoading(true);

    try {
      await cancelEscrow({
        escrowId,
        network: getStacksNetwork(),
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
        onFinish: () => {
          console.log('Escrow cancelled successfully');
          loadEscrows();
          setActionLoading(false);
          setSelectedEscrow(null);
        },
        onCancel: () => {
          setActionLoading(false);
        }
      });
    } catch (error) {
      console.error('Error cancelling escrow:', error);
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Released':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'Expired':
        return 'bg-gray-100 text-gray-800';
      case 'Time-Locked':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending Approvals':
        return 'bg-blue-100 text-blue-800';
      case 'Ready for Release':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">Please connect your wallet to view escrows</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading escrows...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Escrow Monitor</h2>
        <p className="text-gray-600">Track and manage campaign escrow accounts</p>
      </div>

      {escrows.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">No escrows found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {escrows.map(escrow => (
            <div
              key={escrow.escrowId}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Escrow #{escrow.escrowId}</h3>
                    <p className="text-sm text-gray-500">{escrow.campaignName}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(escrow.status)}`}>
                    {escrow.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-semibold">{formatEscrowAmount(escrow.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Released</p>
                    <p className="font-semibold">{formatEscrowAmount(escrow.releasedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className="font-semibold">
                      {formatEscrowAmount(escrow.amount - escrow.releasedAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Approvals</p>
                    <p className="font-semibold">
                      {escrow.approvalCount}/{escrow.requiredApprovers.length}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Release Progress</span>
                    <span className="font-medium">{escrow.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${escrow.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {escrow.canRelease && (
                    <button
                      onClick={() => handleRelease(escrow.escrowId)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Release Full Amount
                    </button>
                  )}
                  {!escrow.released && !escrow.cancelled && (
                    <>
                      <button
                        onClick={() => setSelectedEscrow(escrow)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Partial Release
                      </button>
                      <button
                        onClick={() => handleApprove(escrow.escrowId)}
                        disabled={actionLoading}
                        className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleCancel(escrow.escrowId)}
                        disabled={actionLoading}
                        className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Time Lock: {new Date(escrow.timeLock * 1000).toLocaleString()}</span>
                    <span>Expires: {new Date(escrow.expiresAt * 1000).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Partial Release Modal */}
      {selectedEscrow && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedEscrow(null)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Partial Release</h3>
            <p className="text-gray-600 mb-4">
              Escrow #{selectedEscrow.escrowId} - Available: {formatEscrowAmount(selectedEscrow.amount - selectedEscrow.releasedAmount)}
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Amount to Release (STX)</label>
              <input
                type="number"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
                max={Number(selectedEscrow.amount - selectedEscrow.releasedAmount) / 1_000_000}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handlePartialRelease(selectedEscrow.escrowId)}
                disabled={actionLoading || !partialAmount || parseFloat(partialAmount) <= 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Release'}
              </button>
              <button
                onClick={() => {
                  setSelectedEscrow(null);
                  setPartialAmount('');
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
