// useNetworkStatusV2: poll Stacks network status and chain info
import { useState, useEffect, useRef, useCallback } from 'react';

export interface NetworkInfo {
  server_version: string;
  network_id: number;
  parent_network_id: number;
  stacks_tip_height: number;
  stacks_tip: string;
  stacks_tip_consensus_hash: string;
  burn_block_height: number;
}

export interface NetworkStatusState {
  info: NetworkInfo | null;
  isOnline: boolean;
  isLoading: boolean;
  lastUpdated: number | null;
  error: string | null;
}

const POLL_INTERVAL = 30_000;

async function fetchNetworkInfo(base: string): Promise<NetworkInfo> {
  const res = await fetch(`${base}/v2/info`);
  if (!res.ok) throw new Error(`Network info failed: ${res.status}`);
  return res.json() as Promise<NetworkInfo>;
}

export function useNetworkStatusV2(network: 'mainnet' | 'testnet' = 'mainnet') {
  const base = network === 'testnet' ? 'https://api.testnet.hiro.so' : 'https://api.hiro.so';
  const [state, setState] = useState<NetworkStatusState>({
    info: null, isOnline: true, isLoading: false, lastUpdated: null, error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
