/**
 * read-only-caller.ts
 * Direct Stacks read-only contract call utility.
 * Calls the Hiro API /v2/contracts/call-read endpoint without
 * requiring a wallet or signed transaction.
 */

import { getApiUrl, SupportedNetwork } from './stacks-network';
import { CONTRACT_ADDRESS } from './stacks-config';
import type { ContractName } from './stacks-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReadOnlyCallParams {
  contractAddress?: string;
  contractName: ContractName | string;
  functionName: string;
  functionArgs: string[]; // hex-encoded Clarity arguments
  senderAddress?: string;
  network?: SupportedNetwork;
}

export interface ReadOnlyCallResult {
  okay: boolean;
  result: string; // hex-encoded Clarity value
}

// ---------------------------------------------------------------------------
// Core Read-Only Call
// ---------------------------------------------------------------------------

/**
 * Execute a read-only contract function call directly via Hiro API.
 * Does not require a wallet connection or transaction signing.
 *
 * @param params - Contract, function, and args to call
 * @returns Hex-encoded Clarity result
 */
export async function callReadOnly(
  params: ReadOnlyCallParams,
): Promise<ReadOnlyCallResult> {
  const {
    contractAddress = CONTRACT_ADDRESS,
    contractName,
    functionName,
    functionArgs,
    senderAddress = CONTRACT_ADDRESS,
    network,
  } = params;

  const apiUrl = getApiUrl(network);
  const url = `${apiUrl}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: senderAddress,
      arguments: functionArgs,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Read-only call failed (${response.status}): ${contractName}::${functionName}`,
    );
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Typed Wrappers for AdStack Contracts
// ---------------------------------------------------------------------------

/**
 * Encode a uint as a Clarity argument (hex).
 * Format: 0x01 + 16-byte big-endian uint128
 */
export function encodeUintArg(n: number | bigint): string {
  const bn = BigInt(n);
  const hex = bn.toString(16).padStart(32, '0');
  return `0x01${hex}`;
}

/**
 * Encode a Stacks principal as a Clarity argument (hex).
 * Format: 0x05 + version byte + 20-byte hash160
 * NOTE: For mainnet standard addresses only; use @stacks/transactions for full support.
 */
export function encodePrincipalArgHex(address: string): string {
  // This returns the repr-based encoding for the API
  const bytes = Buffer.from(address);
  return `0x0516${bytes.toString('hex').padEnd(40, '0')}`;
}

/**
 * Call get-campaign on promo-manager.
 */
export async function readCampaign(
  campaignId: number,
  network?: SupportedNetwork,
): Promise<ReadOnlyCallResult> {
  return callReadOnly({
    contractName: 'promo-manager',
    functionName: 'get-campaign',
    functionArgs: [encodeUintArg(campaignId)],
    network,
  });
}

/**
 * Call get-escrow-balance on funds-keeper.
 */
export async function readEscrowBalance(
  campaignId: number,
  network?: SupportedNetwork,
): Promise<ReadOnlyCallResult> {
  return callReadOnly({
    contractName: 'funds-keeper',
    functionName: 'get-escrow-balance',
    functionArgs: [encodeUintArg(campaignId)],
    network,
  });
}

/**
 * Call get-platform-stats on funds-keeper.
 */
export async function readPlatformStats(
  network?: SupportedNetwork,
): Promise<ReadOnlyCallResult> {
  return callReadOnly({
    contractName: 'funds-keeper',
    functionName: 'get-platform-stats',
    functionArgs: [],
    network,
  });
}

/**
 * Call get-contract-version on any AdStack contract.
 */
export async function readContractVersion(
  contractName: ContractName | string,
  network?: SupportedNetwork,
): Promise<ReadOnlyCallResult> {
  return callReadOnly({
    contractName,
    functionName: 'get-contract-version',
    functionArgs: [],
    network,
  });
}
