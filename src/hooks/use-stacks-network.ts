/**
 * use-stacks-network.ts
 * React hook for Stacks network info and block height tracking.
 * Polls the Hiro API for the latest block and exposes derived stats.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  resolveNetwork,
  getNetworkConfig,
  SupportedNetwork,
  NetworkConfig,
  fetchLatestBlock,
} from '@/lib/stacks-network';
import type { BlockInfo } from '@/lib/hiro-api';
import { fetchLatestBlock as fetchBlock } from '@/lib/hiro-api';

export interface StacksNetworkState {
  network: SupportedNetwork;
  config: NetworkConfig;
  latestBlock: BlockInfo | null;
  blockHeight: number;
  blockTime: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to get the active Stacks network configuration and latest block info.
 * Polls for new blocks every 30 seconds by default.
 */
export function useStacksNetwork(
  pollIntervalMs = 30_000,
): StacksNetworkState {
  const network = resolveNetwork() as SupportedNetwork;
  const config = getNetworkConfig(network);

  const [latestBlock, setLatestBlock] = useState<BlockInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlockInfo = useCallback(async () => {
    try {
      setError(null);
      const block = await fetchBlock(network);
      setLatestBlock(block);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch block');
    } finally {
      setLoading(false);
    }
  }, [network]);

  useEffect(() => {
    fetchBlockInfo();

    if (pollIntervalMs > 0) {
      const interval = setInterval(fetchBlockInfo, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchBlockInfo, pollIntervalMs]);

  return {
    network,
    config,
    latestBlock,
    blockHeight: latestBlock?.height ?? 0,
    blockTime: latestBlock?.block_time ?? 0,
    loading,
    error,
    refetch: fetchBlockInfo,
  };
}

/**
 * Hook to get only the current Stacks block height.
 * Lightweight version that doesn't return full block info.
 */
export function useBlockHeight(pollIntervalMs = 60_000): {
  blockHeight: number;
  loading: boolean;
} {
  const { blockHeight, loading } = useStacksNetwork(pollIntervalMs);
  return { blockHeight, loading };
}
