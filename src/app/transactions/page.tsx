'use client';

import { useState } from 'react';
import { useWalletStore } from '@/store/wallet-store';
import { useTransactions } from '@/hooks';
import { TransactionList } from '@/components/transactions';
import { Pagination } from '@/components/ui';
import { WalletGuard } from '@/components/wallet/WalletGuard';

const PAGE_SIZE = 20;

function TransactionsContent() {
  const { address } = useWalletStore();
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;

  const { data: txList, isLoading } = useTransactions(address, PAGE_SIZE, offset);
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

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <WalletGuard
      title="Connect Your Wallet"
      description="Please connect your Stacks wallet to view your transactions."
    >
      <TransactionsContent />
    </WalletGuard>
  );
}
