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

const envNetwork = process.env.NEXT_PUBLIC_NETWORK as string | undefined;
const validNetworks: NetworkType[] = ['mainnet', 'testnet', 'devnet'];

export const CURRENT_NETWORK: NetworkType =
  envNetwork && validNetworks.includes(envNetwork as NetworkType)
    ? (envNetwork as NetworkType)
    : 'mainnet';

export const NETWORK: StacksNetwork = NETWORKS[CURRENT_NETWORK];

/**
 * Devnet deployer address from Clarinet settings/Devnet.toml.
 * Used when NEXT_PUBLIC_NETWORK=devnet for local contract testing.
 */
const DEVNET_DEPLOYER = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

const envContractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

if (!envContractAddress && CURRENT_NETWORK === 'mainnet' && typeof console !== 'undefined') {
  console.warn(
    '[AdStack] NEXT_PUBLIC_CONTRACT_ADDRESS not set for mainnet. Using fallback address. ' +
    'Set this environment variable before deploying to production.'
  );
}

export const CONTRACT_ADDRESS =
  envContractAddress ||
  (CURRENT_NETWORK === 'devnet' ? DEVNET_DEPLOYER : 'SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD');

/**
 * API URL defaults to Hiro mainnet; Clarinet devnet uses localhost:3999.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (CURRENT_NETWORK === 'devnet' ? 'http://localhost:3999' : 'https://api.hiro.so');

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
 * stacks-block-height: current Stacks chain block (used for durations/cooldowns)
 * stacks-block-time: Unix timestamp of current block (Clarity 4 only)
 */
export const BLOCK_TIME = {
  SECONDS_PER_BLOCK: 600,
  BLOCKS_PER_DAY: 144,
  SECONDS_PER_DAY: 86400,
} as const;

/**
 * Clarity version deployed on-chain (matches CONTRACT_VERSION in contracts)
 */
export const CLARITY_CONTRACT_VERSION = '4.0.0';

/**
 * Minimum escrow amount in micro-STX (matches funds-keeper MIN_ESCROW_AMOUNT)
 */
export const MIN_ESCROW_AMOUNT = 100_000;

/**
 * Withdrawal cooldown in blocks (matches funds-keeper WITHDRAWAL_COOLDOWN)
 */
export const WITHDRAWAL_COOLDOWN_BLOCKS = 12;

/**
 * Convert a Clarity v4 stacks-block-time Unix timestamp to a JS Date.
 */
export function blockTimeToDate(blockTime: number | bigint): Date {
  return new Date(Number(blockTime) * 1000);
}

/**
 * Estimate the stacks-block-time for a future block given a reference point.
 */
export function estimateBlockTime(
  targetBlock: number,
  currentBlock: number,
  currentTimestamp: number,
): Date {
  const blockDelta = targetBlock - currentBlock;
  const secondsDelta = blockDelta * BLOCK_TIME.SECONDS_PER_BLOCK;
  return new Date((currentTimestamp + secondsDelta) * 1000);
}

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
  const chain = isMainnet() ? '' : '?chain=testnet';
  return `https://explorer.hiro.so/txid/${txId}${chain}`;
}

export function getExplorerAddressUrl(address: string): string {
  const chain = isMainnet() ? '' : '?chain=testnet';
  return `https://explorer.hiro.so/address/${address}${chain}`;
}
