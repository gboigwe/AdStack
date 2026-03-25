/**
 * hiro-api.ts
 * Typed Hiro API client for AdStack.
 * Covers account info, STX balances, transactions, contract events,
 * block data, and mempool monitoring.
 */

import { getApiUrl, SupportedNetwork } from './stacks-network';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface STXBalance {
  balance: string;
  total_sent: string;
  total_received: string;
  total_fees_sent: string;
  total_miner_rewards_received: string;
  lock_tx_id: string;
  locked: string;
  lock_height: number;
  burnchain_lock_height: number;
  burnchain_unlock_height: number;
}

export interface FungibleTokenBalance {
  balance: string;
  total_sent: string;
  total_received: string;
}

export interface AccountBalances {
  stx: STXBalance;
  fungible_tokens: Record<string, FungibleTokenBalance>;
  non_fungible_tokens: Record<string, { count: string; total_sent: string; total_received: string }>;
}

export interface TransactionResult {
  tx_id: string;
  nonce: number;
  fee_rate: string;
  sender_address: string;
  tx_status: 'success' | 'abort_by_response' | 'abort_by_post_condition' | 'pending' | 'dropped';
  block_hash?: string;
  block_height?: number;
  burn_block_time?: number;
  burn_block_time_iso?: string;
  canonical: boolean;
  tx_index?: number;
  tx_type: string;
}

export interface ContractCallTransaction extends TransactionResult {
  tx_type: 'contract_call';
  contract_call: {
    contract_id: string;
    function_name: string;
    function_signature: string;
    function_args?: Array<{
      hex: string;
      repr: string;
      name: string;
      type: string;
    }>;
  };
}

export interface ContractEvent {
  event_index: number;
  event_type: 'smart_contract_log' | 'stx_asset' | 'fungible_token_asset' | 'non_fungible_token_asset';
  tx_id: string;
  contract_log?: {
    contract_id: string;
    topic: string;
    value: {
      hex: string;
      repr: string;
    };
  };
}

export interface BlockInfo {
  canonical: boolean;
  height: number;
  hash: string;
  block_time: number;
  burn_block_time: number;
  burn_block_hash: string;
  burn_block_height: number;
  tx_count: number;
}

export interface MempoolTransaction {
  tx_id: string;
  tx_status: 'pending';
  tx_type: string;
  receipt_time: number;
  receipt_time_iso: string;
  fee_rate: string;
  sender_address: string;
  nonce: number;
}

// ---------------------------------------------------------------------------
// Base Fetcher
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  network?: SupportedNetwork,
  init?: RequestInit,
): Promise<T> {
  const url = `${getApiUrl(network)}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Hiro API error ${response.status}: ${url}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Account Endpoints
// ---------------------------------------------------------------------------

/**
 * Fetch account STX and token balances.
 */
export async function fetchAccountBalances(
  address: string,
  network?: SupportedNetwork,
): Promise<AccountBalances> {
  return apiFetch(`/extended/v1/address/${address}/balances`, network);
}

/**
 * Fetch STX balance only (lightweight).
 */
export async function fetchSTXBalance(
  address: string,
  network?: SupportedNetwork,
): Promise<STXBalance> {
  const data = await fetchAccountBalances(address, network);
  return data.stx;
}

// ---------------------------------------------------------------------------
// Transaction Endpoints
// ---------------------------------------------------------------------------

/**
 * Fetch a transaction by ID.
 */
export async function fetchTransaction(
  txId: string,
  network?: SupportedNetwork,
): Promise<TransactionResult> {
  const id = txId.startsWith('0x') ? txId : `0x${txId}`;
  return apiFetch(`/extended/v1/tx/${id}`, network);
}

/**
 * Fetch recent transactions for an address (paginated).
 */
export async function fetchAddressTransactions(
  address: string,
  options: { limit?: number; offset?: number; network?: SupportedNetwork } = {},
): Promise<{ results: TransactionResult[]; total: number; limit: number; offset: number }> {
  const { limit = 20, offset = 0, network } = options;
  return apiFetch(
    `/extended/v1/address/${address}/transactions?limit=${limit}&offset=${offset}`,
    network,
  );
}

// ---------------------------------------------------------------------------
// Contract Event Endpoints
// ---------------------------------------------------------------------------

/**
 * Fetch contract events (print events) for a specific contract.
 */
export async function fetchContractEvents(
  contractId: string,
  options: { limit?: number; offset?: number; unanchored?: boolean; network?: SupportedNetwork } = {},
): Promise<{ results: ContractEvent[] }> {
  const { limit = 50, offset = 0, unanchored = false, network } = options;
  return apiFetch(
    `/extended/v1/contract/${contractId}/events?limit=${limit}&offset=${offset}&unanchored=${unanchored}`,
    network,
  );
}

/**
 * Fetch events for a specific transaction.
 */
export async function fetchTransactionEvents(
  txId: string,
  network?: SupportedNetwork,
): Promise<{ results: ContractEvent[] }> {
  const id = txId.startsWith('0x') ? txId : `0x${txId}`;
  return apiFetch(`/extended/v1/tx/events?tx_id=${id}`, network);
}

// ---------------------------------------------------------------------------
// Block Endpoints
// ---------------------------------------------------------------------------

/**
 * Fetch info for the latest Stacks block.
 */
export async function fetchLatestBlock(
  network?: SupportedNetwork,
): Promise<BlockInfo> {
  return apiFetch('/extended/v2/blocks?limit=1', network).then(
    (data: any) => data.results[0],
  );
}

/**
 * Fetch a specific block by height.
 */
export async function fetchBlockByHeight(
  height: number,
  network?: SupportedNetwork,
): Promise<BlockInfo> {
  return apiFetch(`/extended/v2/blocks/${height}`, network);
}

// ---------------------------------------------------------------------------
// Mempool Endpoints
// ---------------------------------------------------------------------------

/**
 * Fetch mempool transactions for an address.
 */
export async function fetchMempoolTransactions(
  address: string,
  network?: SupportedNetwork,
): Promise<{ results: MempoolTransaction[]; total: number }> {
  return apiFetch(
    `/extended/v1/tx/mempool?sender_address=${address}&limit=50`,
    network,
  );
}

/**
 * Check if a specific transaction is still in the mempool.
 */
export async function isInMempool(
  txId: string,
  network?: SupportedNetwork,
): Promise<boolean> {
  try {
    const tx = await fetchTransaction(txId, network);
    return tx.tx_status === 'pending';
  } catch {
    return false;
  }
}
