/**
 * stacks-network.ts
 * Stacks network client and configuration for AdStack.
 * Provides typed wrappers around @stacks/network for multi-network support.
 */

import {
  STACKS_MAINNET,
  STACKS_TESTNET,
  STACKS_DEVNET,
  StacksNetwork,
  StacksNetworkName,
} from '@stacks/network';

// ---------------------------------------------------------------------------
// Network Configuration
// ---------------------------------------------------------------------------

export type SupportedNetwork = 'mainnet' | 'testnet' | 'devnet';

export interface NetworkConfig {
  network: StacksNetwork;
  name: SupportedNetwork;
  apiUrl: string;
  explorerBaseUrl: string;
  chainId: number;
  btcNetwork: 'mainnet' | 'testnet' | 'regtest';
}

const NETWORK_CONFIGS: Record<SupportedNetwork, NetworkConfig> = {
  mainnet: {
    network: STACKS_MAINNET,
    name: 'mainnet',
    apiUrl: 'https://api.hiro.so',
    explorerBaseUrl: 'https://explorer.hiro.so',
    chainId: 1,
    btcNetwork: 'mainnet',
  },
  testnet: {
    network: STACKS_TESTNET,
    name: 'testnet',
    apiUrl: 'https://api.testnet.hiro.so',
    explorerBaseUrl: 'https://explorer.hiro.so',
    chainId: 2147483648,
    btcNetwork: 'testnet',
  },
  devnet: {
    network: STACKS_DEVNET,
    name: 'devnet',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3999',
    explorerBaseUrl: 'http://localhost:8080',
    chainId: 2147483648,
    btcNetwork: 'regtest',
  },
};

// ---------------------------------------------------------------------------
// Active Network Resolver
// ---------------------------------------------------------------------------

export function resolveNetwork(name?: string): SupportedNetwork {
  const env = name || process.env.NEXT_PUBLIC_NETWORK || 'mainnet';
  if (env === 'testnet' || env === 'devnet') return env;
  return 'mainnet';
}

export function getNetworkConfig(name?: SupportedNetwork): NetworkConfig {
  const resolved = name ?? resolveNetwork();
  return NETWORK_CONFIGS[resolved];
}

export function getStacksNetwork(name?: SupportedNetwork): StacksNetwork {
  return getNetworkConfig(name).network;
}

export function getApiUrl(name?: SupportedNetwork): string {
  const config = getNetworkConfig(name);
  return process.env.NEXT_PUBLIC_API_URL ?? config.apiUrl;
}

// ---------------------------------------------------------------------------
// Network Utilities
// ---------------------------------------------------------------------------

export function isMainnet(name?: SupportedNetwork): boolean {
  return (name ?? resolveNetwork()) === 'mainnet';
}

export function isTestnet(name?: SupportedNetwork): boolean {
  return (name ?? resolveNetwork()) === 'testnet';
}

export function isDevnet(name?: SupportedNetwork): boolean {
  return (name ?? resolveNetwork()) === 'devnet';
}

/**
 * Get Hiro explorer URL for a transaction.
 */
export function getExplorerTxUrl(
  txId: string,
  network?: SupportedNetwork,
): string {
  if (!txId || txId.length === 0) {
    throw new Error('getExplorerTxUrl: txId is required');
  }
  const { explorerBaseUrl, name } = getNetworkConfig(network);
  const chain = name !== 'mainnet' ? `?chain=${name}` : '';
  const normalizedTxId = txId.startsWith('0x') ? txId : `0x${txId}`;
  return `${explorerBaseUrl}/txid/${encodeURIComponent(normalizedTxId)}${chain}`;
}

/**
 * Get Hiro explorer URL for an address.
 */
export function getExplorerAddressUrl(
  address: string,
  network?: SupportedNetwork,
): string {
  if (!address || address.length === 0) {
    throw new Error('getExplorerAddressUrl: address is required');
  }
  const { explorerBaseUrl, name } = getNetworkConfig(network);
  const chain = name !== 'mainnet' ? `?chain=${name}` : '';
  return `${explorerBaseUrl}/address/${encodeURIComponent(address)}${chain}`;
}

/**
 * Get Hiro explorer URL for a contract.
 */
export function getExplorerContractUrl(
  contractId: string,
  network?: SupportedNetwork,
): string {
  const { explorerBaseUrl, name } = getNetworkConfig(network);
  const chain = name !== 'mainnet' ? `?chain=${name}` : '';
  return `${explorerBaseUrl}/contract/${contractId}${chain}`;
}

/**
 * Build a Hiro API endpoint URL.
 */
export function buildApiUrl(
  path: string,
  network?: SupportedNetwork,
): string {
  const base = getApiUrl(network);
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
