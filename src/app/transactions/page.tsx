'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { useTransactions } from '@/hooks';
import { TransactionList } from '@/components/transactions';

const PAGE_SIZE = 20;

export default function TransactionsPage() {
  const { isConnected, address } = useWalletStore();
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;

  const { data: txList, isLoading } = useTransactions(address, PAGE_SIZE, offset);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600">
            Please connect your Stacks wallet to view your transactions.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = txList ? Math.ceil(txList.total / PAGE_SIZE) : 0;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-2">
            {txList && !isLoading
              ? `${txList.total.toLocaleString()} total transactions`
              : 'Loading transactions...'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6">
            <TransactionList
              transactions={txList?.results ?? []}
              isLoading={isLoading}
              emptyMessage="No transactions found for this address"
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
