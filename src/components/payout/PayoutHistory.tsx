'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/store/wallet-store';
import {
  type PayoutBatch,
  PayoutBatchStatus,
  getPayoutBatchStatusName,
  calculateBatchProgress,
  formatPayoutAmount
} from '@/lib/contracts/payout-automation';

interface PayoutRecord {
  payoutId: number;
  campaignId: number;
  campaignName: string;
  recipient: string;
  amount: bigint;
  timestamp: number;
  txHash: string;
  status: 'completed' | 'failed' | 'pending';
  type: 'performance' | 'scheduled' | 'batch';
}

interface PayoutBatchWithDetails extends PayoutBatch {
  campaignName: string;
  progress: number;
}

type ViewMode = 'individual' | 'batches';
type FilterStatus = 'all' | 'completed' | 'pending' | 'failed';

export default function PayoutHistory({ campaignId }: { campaignId?: number }) {
  const { address, isConnected } = useWallet();
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [batches, setBatches] = useState<PayoutBatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isConnected && address) {
      loadPayoutHistory();

      // Refresh every 30 seconds
      const interval = setInterval(loadPayoutHistory, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, address, campaignId]);

  const loadPayoutHistory = async () => {
    try {
      // TODO: Fetch payouts from contract
      // For now, using mock data
      const mockPayouts: PayoutRecord[] = [
        {
          payoutId: 1,
          campaignId: 1,
          campaignName: 'Summer Sale 2026',
          recipient: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
          amount: 500000000n,
          timestamp: Math.floor(Date.now() / 1000) - 3600,
          txHash: '0x1234...5678',
          status: 'completed',
          type: 'performance'
        },
        {
          payoutId: 2,
          campaignId: 1,
          campaignName: 'Summer Sale 2026',
          recipient: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
          amount: 750000000n,
          timestamp: Math.floor(Date.now() / 1000) - 7200,
          txHash: '0xabcd...ef01',
          status: 'completed',
          type: 'batch'
        },
        {
          payoutId: 3,
          campaignId: 2,
          campaignName: 'Product Launch',
          recipient: 'SP1P72Z3704VMT3DMHPP2CB8TGQWGDBHD3RPR9GZS',
          amount: 1000000000n,
          timestamp: Math.floor(Date.now() / 1000) - 10800,
          txHash: '0x9876...4321',
          status: 'completed',
          type: 'scheduled'
        },
        {
          payoutId: 4,
          campaignId: 1,
          campaignName: 'Summer Sale 2026',
          recipient: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
          amount: 600000000n,
          timestamp: Math.floor(Date.now() / 1000),
          txHash: '',
          status: 'pending',
          type: 'performance'
        }
      ];

      const mockBatches: PayoutBatchWithDetails[] = [
        {
          batchId: 1,
          campaignId: 1,
          totalAmount: 5000000000n,
          recipientCount: 10,
          processedCount: 10,
          status: PayoutBatchStatus.COMPLETED,
          createdAt: Math.floor(Date.now() / 1000) - 86400,
          executedAt: Math.floor(Date.now() / 1000) - 84600,
          executedBy: address || '',
          campaignName: 'Summer Sale 2026',
          progress: 100
        },
        {
          batchId: 2,
          campaignId: 2,
          totalAmount: 3000000000n,
          recipientCount: 6,
          processedCount: 4,
          status: PayoutBatchStatus.PROCESSING,
          createdAt: Math.floor(Date.now() / 1000) - 3600,
          executedAt: Math.floor(Date.now() / 1000) - 1800,
          executedBy: address || '',
          campaignName: 'Product Launch',
          progress: 67
        }
      ];

      const filteredPayouts = mockPayouts.filter(p => !campaignId || p.campaignId === campaignId);
      const filteredBatches = mockBatches.filter(b => !campaignId || b.campaignId === campaignId);

      setPayouts(filteredPayouts);
      setBatches(filteredBatches.map(b => ({
        ...b,
        progress: calculateBatchProgress(b)
      })));
      setLoading(false);
    } catch (error) {
      console.error('Error loading payout history:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBatchStatusColor = (status: PayoutBatchStatus): string => {
    switch (status) {
      case PayoutBatchStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case PayoutBatchStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case PayoutBatchStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case PayoutBatchStatus.FAILED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'performance':
        return '📊';
      case 'scheduled':
        return '⏰';
      case 'batch':
        return '📦';
      default:
        return '💰';
    }
  };

  const filteredPayouts = payouts
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p =>
      searchTerm === '' ||
      p.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.campaignName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const filteredBatches = batches.filter(b => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') return b.status === PayoutBatchStatus.COMPLETED;
    if (filterStatus === 'pending') return b.status === PayoutBatchStatus.PENDING || b.status === PayoutBatchStatus.PROCESSING;
    if (filterStatus === 'failed') return b.status === PayoutBatchStatus.FAILED;
    return true;
  });

  const totalPaidOut = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0n);

  const pendingAmount = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0n);

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">Please connect your wallet to view payout history</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading payout history...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Payout History</h2>
        <p className="text-gray-600">View and track all campaign payouts</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Paid Out</p>
          <p className="text-2xl font-bold">{formatPayoutAmount(totalPaidOut)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Pending Payouts</p>
          <p className="text-2xl font-bold text-yellow-600">{formatPayoutAmount(pendingAmount)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold">{payouts.length}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* View mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('individual')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'individual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setViewMode('batches')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'batches'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Batches
            </button>
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          {/* Search */}
          {viewMode === 'individual' && (
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by recipient or campaign..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      </div>

      {/* Individual payouts view */}
      {viewMode === 'individual' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredPayouts.length === 0 ? (
            <div className="p-12 text-center text-gray-600">
              No payouts found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPayouts.map(payout => (
                    <tr key={payout.payoutId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-2xl">
                        {getTypeIcon(payout.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payout.campaignName}</div>
                        <div className="text-sm text-gray-500">ID: {payout.campaignId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-gray-900">
                          {payout.recipient.slice(0, 8)}...{payout.recipient.slice(-6)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatPayoutAmount(payout.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payout.timestamp * 1000).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payout.status)}`}>
                          {payout.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Batch payouts view */}
      {viewMode === 'batches' && (
        <div className="grid gap-4">
          {filteredBatches.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-600">
              No payout batches found
            </div>
          ) : (
            filteredBatches.map(batch => (
              <div key={batch.batchId} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Batch #{batch.batchId}</h3>
                    <p className="text-sm text-gray-500">{batch.campaignName}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBatchStatusColor(batch.status)}`}>
                    {getPayoutBatchStatusName(batch.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-semibold">{formatPayoutAmount(batch.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Recipients</p>
                    <p className="font-semibold">{batch.recipientCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Processed</p>
                    <p className="font-semibold">{batch.processedCount}/{batch.recipientCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-semibold">{new Date(batch.createdAt * 1000).toLocaleDateString()}</p>
                  </div>
                </div>

                {batch.status === PayoutBatchStatus.PROCESSING && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Processing Progress</span>
                      <span className="font-medium">{batch.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${batch.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
