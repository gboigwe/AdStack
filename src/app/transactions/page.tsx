'use client';

import { Suspense, useState, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { useTransactions, useMempoolTransactions, useDebounce, useQueryParams } from '@/hooks';
import { TransactionList } from '@/components/transactions';
import { TransactionFilters, type TxStatusFilter, type TxTypeFilter } from '@/components/transactions/TransactionFilters';
import { Pagination, Badge, PageTransition } from '@/components/ui';
import { WalletGuard } from '@/components/wallet/WalletGuard';

const PAGE_SIZE = 20;

function matchesStatus(txStatus: string, filter: TxStatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'success') return txStatus === 'success';
  if (filter === 'pending') return txStatus === 'pending';
  if (filter === 'failed') return txStatus.startsWith('abort');
  return true;
}

const FILTER_DEFAULTS = {
  page: '0',
  q: '',
  status: 'all',
  type: 'all',
};

function TransactionsContent() {
  const { address } = useWalletStore();
  const [params, setParams] = useQueryParams(FILTER_DEFAULTS);
  const page = parseInt(params.page, 10) || 0;
  const searchQuery = params.q;
  const statusFilter = params.status as TxStatusFilter;
  const typeFilter = params.type as TxTypeFilter;
  const debouncedSearch = useDebounce(searchQuery, 300);
  const offset = page * PAGE_SIZE;

  const { data: txList, isLoading } = useTransactions(address, PAGE_SIZE, offset);
  const { data: mempool, isLoading: mempoolLoading } = useMempoolTransactions(address);
  const totalPages = txList ? Math.ceil(txList.total / PAGE_SIZE) : 0;
  const pendingCount = mempool?.total ?? 0;

  const filteredTxs = useMemo(() => {
    if (!txList?.results) return [];
    return txList.results.filter((tx) => {
      if (debouncedSearch && !tx.tx_id.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      if (!matchesStatus(tx.tx_status, statusFilter)) return false;
      if (typeFilter !== 'all' && tx.tx_type !== typeFilter) return false;
      return true;
    });
  }, [txList?.results, debouncedSearch, statusFilter, typeFilter]);

  return (
    <PageTransition className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-2">
            {txList && !isLoading
              ? `${txList.total.toLocaleString()} total transactions`
              : 'Loading transactions...'}
          </p>
        </div>

        {/* Pending Mempool Transactions */}
        {pendingCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
            <div className="p-4 flex items-center gap-3 border-b border-yellow-200">
              <Clock className="w-5 h-5 text-yellow-600" />
              <h2 className="font-semibold text-yellow-900">Pending Transactions</h2>
              <Badge variant="warning">{pendingCount}</Badge>
            </div>
            <div className="p-4">
              <TransactionList
                transactions={mempool?.results ?? []}
                isLoading={mempoolLoading}
                emptyMessage="No pending transactions"
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <TransactionFilters
            searchQuery={searchQuery}
            onSearchChange={(q) => setParams({ q, page: '0' })}
            statusFilter={statusFilter}
            onStatusChange={(s) => setParams({ status: s, page: '0' })}
            typeFilter={typeFilter}
            onTypeChange={(t) => setParams({ type: t, page: '0' })}
          />
        </div>

        {/* Confirmed Transactions */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6">
            <TransactionList
              transactions={filteredTxs}
              isLoading={isLoading}
              emptyMessage={debouncedSearch || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No transactions match your filters'
                : 'No transactions found for this address'}
            />
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setParams({ page: String(p) })}
          />
        </div>
      </div>
    </PageTransition>
  );
}

export default function TransactionsPage() {
  return (
    <WalletGuard
      title="Connect Your Wallet"
      description="Please connect your Stacks wallet to view your transactions."
    >
      <Suspense>
        <TransactionsContent />
      </Suspense>
    </WalletGuard>
  );
}
