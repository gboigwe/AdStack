/**
 * use-transaction-history.ts
 * React hook for paginated transaction history from Hiro API.
 * Supports filtering by contract name and function for AdStack events.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchAddressTransactions,
  TransactionResult,
  ContractCallTransaction,
} from '@/lib/hiro-api';
import { SupportedNetwork } from '@/lib/stacks-network';
import { CONTRACT_ADDRESS } from '@/lib/stacks-config';

export interface TransactionHistoryOptions {
  pageSize?: number;
  filterContractName?: string;
  filterFunctionName?: string;
  network?: SupportedNetwork;
}

export interface TransactionHistoryState {
  transactions: TransactionResult[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  loadMore: () => void;
  reset: () => void;
  refetch: () => void;
}

/**
 * Hook to fetch paginated transaction history for an address.
 * Optionally filters to AdStack contract interactions.
 */
export function useTransactionHistory(
  address: string | undefined,
  options: TransactionHistoryOptions = {},
): TransactionHistoryState {
  const {
    pageSize = 20,
    filterContractName,
    filterFunctionName,
    network,
  } = options;

  const [transactions, setTransactions] = useState<TransactionResult[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (pageOffset: number, append: boolean) => {
      if (!address) return;

      setLoading(true);
      setError(null);

      try {
        const data = await fetchAddressTransactions(address, {
          limit: pageSize,
          offset: pageOffset,
          network,
        });

        let results = data.results;

        // Filter to AdStack contract calls if requested
        if (filterContractName) {
          results = results.filter((tx) => {
            if (tx.tx_type !== 'contract_call') return false;
            const call = (tx as ContractCallTransaction).contract_call;
            const matchesContract = call.contract_id === `${CONTRACT_ADDRESS}.${filterContractName}`;
            const matchesFunction = filterFunctionName
              ? call.function_name === filterFunctionName
              : true;
            return matchesContract && matchesFunction;
          });
        }

        setTransactions((prev) => append ? [...prev, ...results] : results);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    },
    [address, pageSize, filterContractName, filterFunctionName, network],
  );

  useEffect(() => {
    setOffset(0);
    setTransactions([]);
    fetchPage(0, false);
  }, [address, filterContractName, filterFunctionName]);

  return {
    transactions,
    total,
    page: Math.floor(offset / pageSize),
    pageSize,
    hasMore: transactions.length < total,
    loading,
    error,
    loadMore: () => {
      const nextOffset = offset + pageSize;
      setOffset(nextOffset);
      fetchPage(nextOffset, true);
    },
    reset: () => {
      setOffset(0);
      setTransactions([]);
      fetchPage(0, false);
    },
    refetch: () => fetchPage(offset, false),
  };
}

/**
 * Hook to get only AdStack contract transactions for an address.
 */
export function useAdStackTransactionHistory(
  address: string | undefined,
  contractName?: string,
  network?: SupportedNetwork,
) {
  return useTransactionHistory(address, {
    filterContractName: contractName ?? 'promo-manager',
    network,
    pageSize: 10,
  });
}
