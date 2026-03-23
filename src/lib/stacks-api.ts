/**
 * Stacks API Client
 * Centralized HTTP client for the Hiro Stacks API.
 * Handles request construction, error parsing, response typing,
 * and retry logic for transient failures.
 */

import { API_URL, CURRENT_NETWORK } from './stacks-config';

/** Base response shape returned by every API helper. */
export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/** Account balance as returned by the /extended/v1/address/{addr}/stx endpoint. */
export interface StxBalance {
  balance: string;
  total_sent: string;
  total_received: string;
  lock_tx_id: string;
  locked: string;
  lock_height: number;
  burnchain_lock_height: number;
  burnchain_unlock_height: number;
}

/** Minimal transaction shape from the API. */
export interface ApiTransaction {
  tx_id: string;
  tx_type: string;
  tx_status: string;
  block_height: number;
  burn_block_time: number;
  burn_block_time_iso: string;
  fee_rate: string;
  sender_address: string;
  nonce: number;
}

/** Page of transactions. */
export interface TransactionList {
  total: number;
  limit: number;
  offset: number;
  results: ApiTransaction[];
}

/** Status codes that indicate a transient failure worth retrying. */
const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);

/** Maximum number of retry attempts for transient failures. */
const MAX_RETRIES = 3;

/** Base delay in ms for exponential backoff (doubles on each retry). */
const BASE_DELAY_MS = 500;

/**
 * Wait for a specified number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Try to extract a meaningful error message from an API error response.
 * The Hiro API returns error details in the response body for 4xx errors.
 */
async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body === 'object') {
      // Hiro API error format: { error: "...", reason: "..." }
      if (body.error) return `${body.error}${body.reason ? `: ${body.reason}` : ''}`;
      if (body.message) return body.message;
    }
  } catch {
    // Body wasn't JSON; fall through to status text
  }
  return `API ${res.status}: ${res.statusText}`;
}

/**
 * Low-level fetch wrapper that prepends the API_URL, handles errors,
 * and retries transient failures with exponential backoff.
 */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const url = `${API_URL}${path}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });

      if (!res.ok) {
        // Retry on transient server errors (429, 5xx)
        if (RETRYABLE_STATUS_CODES.has(res.status) && attempt < MAX_RETRIES) {
          await delay(BASE_DELAY_MS * Math.pow(2, attempt));
          continue;
        }

        const errorMessage = await parseErrorBody(res);
        return { ok: false, status: res.status, error: errorMessage };
      }

      const data = (await res.json()) as T;
      return { ok: true, data };
    } catch (err) {
      // Network errors are retryable
      if (attempt < MAX_RETRIES) {
        await delay(BASE_DELAY_MS * Math.pow(2, attempt));
        continue;
      }

      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `Network error: ${message}` };
    }
  }

  // Should never reach here, but TypeScript needs a return
  return { ok: false, error: 'Max retries exceeded' };
}

/**
 * Fetch STX balance for an address.
 */
export async function fetchStxBalance(address: string): Promise<ApiResult<StxBalance>> {
  return apiFetch<StxBalance>(`/extended/v1/address/${address}/stx`);
}

/**
 * Fetch recent transactions for an address.
 */
export async function fetchTransactions(
  address: string,
  limit = 20,
  offset = 0,
): Promise<ApiResult<TransactionList>> {
  return apiFetch<TransactionList>(
    `/extended/v1/address/${address}/transactions?limit=${limit}&offset=${offset}`,
  );
}

/**
 * Fetch a single transaction by ID.
 */
export async function fetchTransaction(txId: string): Promise<ApiResult<ApiTransaction>> {
  return apiFetch<ApiTransaction>(`/extended/v1/tx/${txId}`);
}

/**
 * Fetch the current block height of the network.
 */
export async function fetchBlockHeight(): Promise<ApiResult<number>> {
  const result = await apiFetch<{ stacks_tip_height: number }>('/v2/info');
  if (result.ok && result.data) {
    return { ok: true, data: result.data.stacks_tip_height };
  }
  return { ok: false, error: result.error };
}

/**
 * Call a read-only Clarity function via the Hiro API.
 */
export async function callReadOnlyFunction(
  contractAddress: string,
  contractName: string,
  functionName: string,
  args: string[],
  senderAddress: string,
): Promise<ApiResult<{ okay: boolean; result: string }>> {
  return apiFetch(`/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`, {
    method: 'POST',
    body: JSON.stringify({
      sender: senderAddress,
      arguments: args,
    }),
  });
}

/**
 * Fetch pending mempool transactions for an address.
 */
export async function fetchMempoolTransactions(
  address: string,
  limit = 20,
): Promise<ApiResult<TransactionList>> {
  return apiFetch<TransactionList>(
    `/extended/v1/tx/mempool?sender_address=${address}&limit=${limit}`,
  );
}

/**
 * Check if the API is reachable.
 */
export async function healthCheck(): Promise<boolean> {
  const result = await apiFetch<{ status: string }>('/extended');
  return result.ok;
}

/**
 * Get the API URL for the current network (useful for debugging).
 */
export function getApiUrl(): string {
  return API_URL;
}

export function getNetworkName(): string {
  return CURRENT_NETWORK;
}
