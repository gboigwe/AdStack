import { STACKS_MAINNET, STACKS_TESTNET, STACKS_DEVNET, StacksNetwork } from '@stacks/network';

/**
 * Network Configuration for Clarity v4
 * Using latest Stacks.js v7+ patterns
 */

export const NETWORKS = {
  mainnet: STACKS_MAINNET,
  testnet: STACKS_TESTNET,
  devnet: STACKS_DEVNET,
} as const;

export type NetworkType = keyof typeof NETWORKS;

export const CURRENT_NETWORK: NetworkType =
  (process.env.NEXT_PUBLIC_NETWORK as NetworkType) || 'mainnet';

export const NETWORK: StacksNetwork = NETWORKS[CURRENT_NETWORK];

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  'SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api.hiro.so';

/**
 * Deployed Clarity v4 Contract Names
 */
export const CONTRACTS = {
  ASSET_LIBRARY: 'asset-library',
  STATS_TRACKER: 'stats-tracker',
  OFFER_EXCHANGE: 'offer-exchange',
  PROMO_MANAGER: 'promo-manager',
  MEDIATION_HUB: 'mediation-hub',
  FUNDS_KEEPER: 'funds-keeper',
  VOTE_HANDLER: 'vote-handler',
  ORACLE_LINK: 'oracle-link',
  CASH_DISTRIBUTOR: 'cash-distributor',
  PARTNER_HUB: 'partner-hub',
  PRIZE_POOL: 'prize-pool',
  SUBSCRIPTION_HUB: 'subscription-hub',
  AUDIENCE_SELECTOR: 'audience-selector',
  USER_PROFILES: 'user-profiles',
  THREAT_DETECTOR: 'threat-detector',
} as const;

export type ContractName = typeof CONTRACTS[keyof typeof CONTRACTS];

/**
 * App Configuration for Stacks Connect
 */
export const APP_DETAILS = {
  name: 'AdStack',
  icon: typeof window !== 'undefined'
    ? `${window.location.origin}/logo.png`
    : '/logo.png',
};

/**
 * Transaction Configuration
 */
export const TX_OPTIONS = {
  FEE_MULTIPLIER: 1.5,
  DEFAULT_FEE: 2000n,
  MAX_FEE: 100000n,
} as const;

/**
 * Clarity v4 Block Time Constants
 */
export const BLOCK_TIME = {
  SECONDS_PER_BLOCK: 600,
  BLOCKS_PER_DAY: 144,
  SECONDS_PER_DAY: 86400,
} as const;

/**
 * STX Conversion
 */
export const MICRO_STX = 1_000_000;

export function microStxToStx(microStx: number | bigint): number {
  return Number(microStx) / MICRO_STX;
}

export function stxToMicroStx(stx: number): bigint {
  return BigInt(Math.floor(stx * MICRO_STX));
}

export function getContractId(contractName: ContractName): string {
  return `${CONTRACT_ADDRESS}.${contractName}`;
}

export function isMainnet(): boolean {
  return CURRENT_NETWORK === 'mainnet';
}

export function getExplorerTxUrl(txId: string): string {
  const baseUrl = isMainnet()
    ? 'https://explorer.hiro.so/txid'
    : 'https://explorer.hiro.so/txid?chain=testnet';
  return `${baseUrl}/${txId}`;
}

export function getExplorerAddressUrl(address: string): string {
  const baseUrl = isMainnet()
    ? 'https://explorer.hiro.so/address'
    : 'https://explorer.hiro.so/address?chain=testnet';
  return `${baseUrl}/${address}`;
}
