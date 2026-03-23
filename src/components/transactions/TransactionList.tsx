'use client';

import { memo } from 'react';
import { ExternalLink } from 'lucide-react';
import { type ApiTransaction } from '@/lib/stacks-api';
import { formatTxId, formatTimestamp, formatFee } from '@/lib/display-utils';
import { getExplorerTxUrl } from '@/lib/stacks-config';
import { Skeleton, CopyButton } from '@/components/ui';

interface TransactionListProps {
  transactions: ApiTransaction[];
  isLoading?: boolean;
  emptyMessage?: string;
}

function statusBadge(status: string) {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'abort_by_response':
    case 'abort_by_post_condition':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

/** Static map — hoisted out of render to avoid re-creation. */
const TX_TYPE_LABELS: Record<string, string> = {
  token_transfer: 'Transfer',
  contract_call: 'Contract Call',
  smart_contract: 'Deploy',
  coinbase: 'Coinbase',
  poison_microblock: 'Poison',
};

function txTypeLabel(txType: string): string {
  return TX_TYPE_LABELS[txType] || txType;
}

export const TransactionList = memo(function TransactionList({
  transactions,
  isLoading = false,
  emptyMessage = 'No transactions found',
}: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center justify-between py-3 px-1">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-44 mb-2" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-16 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {transactions.map((tx) => (
        <div
          key={tx.tx_id}
          className="flex items-center justify-between py-3 px-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                {formatTxId(tx.tx_id)}
              </span>
              <CopyButton text={tx.tx_id} label="tx hash" />
              <a
                href={getExplorerTxUrl(tx.tx_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{txTypeLabel(tx.tx_type)}</span>
              <span className="text-xs text-gray-400">&middot;</span>
              <span className="text-xs text-gray-500">
                Block {tx.block_height.toLocaleString()}
              </span>
              {tx.burn_block_time > 0 && (
                <>
                  <span className="text-xs text-gray-400">&middot;</span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(tx.burn_block_time)}
                  </span>
                </>
              )}
              {tx.fee_rate && (
                <>
                  <span className="text-xs text-gray-400">&middot;</span>
                  <span className="text-xs text-gray-500">
                    Fee: {formatFee(tx.fee_rate)}
                  </span>
                </>
              )}
            </div>
          </div>
          <span
            className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${statusBadge(tx.tx_status)}`}
          >
            {tx.tx_status === 'abort_by_response' ? 'Failed' : tx.tx_status}
          </span>
        </div>
      ))}
    </div>
  );
});
