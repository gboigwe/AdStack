// Hiro API accounts endpoints

export const HIRO_API_BASE = 'https://api.hiro.so';

export const HIRO_TESTNET_BASE = 'https://api.testnet.hiro.so';

export type Network = 'mainnet' | 'testnet';

export type AccountBalance = { stx: StxBalance; fungible_tokens: Record<string, FtBalance>; non_fungible_tokens: Record<string, NftHolding> };

export type StxBalance = { balance: string; total_sent: string; total_received: string; total_fees_sent: string; total_miner_rewards_received: string; lock_tx_id: string; locked: string; lock_height: number; burnchain_lock_height: number; burnchain_unlock_height: number };

export type FtBalance = { balance: string; total_sent: string; total_received: string };

export type NftHolding = { count: string; total_sent: string; total_received: string };

export type AccountTransaction = { tx_id: string; tx_type: string; block_height: number; burn_block_time: number };

export type AccountTransactionsResponse = { limit: number; offset: number; total: number; results: AccountTransaction[] };

export function getApiBase(network: Network = 'mainnet'): string {
  return network === 'mainnet' ? HIRO_API_BASE : HIRO_TESTNET_BASE;
}

export async function fetchAccountBalance(address: string, network: Network = 'mainnet'): Promise<AccountBalance> {
  const url = `${getApiBase(network)}/v2/accounts/${address}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch balance: ${res.status}`);
  return res.json();
}

export async function fetchAccountTransactions(address: string, network: Network = 'mainnet', limit = 20, offset = 0): Promise<AccountTransactionsResponse> {
  const url = `${getApiBase(network)}/extended/v1/address/${address}/transactions?limit=${limit}&offset=${offset}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
  return res.json();
}

export async function fetchAccountStxBalance(address: string, network: Network = 'mainnet'): Promise<StxBalance> {
  const balance = await fetchAccountBalance(address, network);
  return balance.stx;
}

export async function fetchAccountNonce(address: string, network: Network = 'mainnet'): Promise<number> {
  const url = `${getApiBase(network)}/v2/accounts/${address}?proof=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch nonce: ${res.status}`);
  const data = await res.json();
  return data.nonce as number;
}

export const API_ENDPOINT_VERSION_1 = 'v1';

export const API_ENDPOINT_VERSION_2 = 'v2';

export const API_ENDPOINT_VERSION_3 = 'v3';

export const API_ENDPOINT_VERSION_4 = 'v4';

export const API_ENDPOINT_VERSION_5 = 'v5';

export const API_ENDPOINT_VERSION_6 = 'v6';

export const API_ENDPOINT_VERSION_7 = 'v7';

export const API_ENDPOINT_VERSION_8 = 'v8';

export const API_ENDPOINT_VERSION_9 = 'v9';

export const API_ENDPOINT_VERSION_10 = 'v10';

export const API_ENDPOINT_VERSION_11 = 'v11';

export const API_ENDPOINT_VERSION_12 = 'v12';

export const API_ENDPOINT_VERSION_13 = 'v13';

export const API_ENDPOINT_VERSION_14 = 'v14';

export const API_ENDPOINT_VERSION_15 = 'v15';

export const API_ENDPOINT_VERSION_16 = 'v16';

export const API_ENDPOINT_VERSION_17 = 'v17';

export const API_ENDPOINT_VERSION_18 = 'v18';

export const API_ENDPOINT_VERSION_19 = 'v19';

export const API_ENDPOINT_VERSION_20 = 'v20';

export const API_ENDPOINT_VERSION_21 = 'v21';

export const API_ENDPOINT_VERSION_22 = 'v22';

export const API_ENDPOINT_VERSION_23 = 'v23';

export const API_ENDPOINT_VERSION_24 = 'v24';

export const API_ENDPOINT_VERSION_25 = 'v25';

export const API_ENDPOINT_VERSION_26 = 'v26';

export const API_ENDPOINT_VERSION_27 = 'v27';

export const API_ENDPOINT_VERSION_28 = 'v28';

export const API_ENDPOINT_VERSION_29 = 'v29';

export const API_ENDPOINT_VERSION_30 = 'v30';

export const API_ENDPOINT_VERSION_31 = 'v31';

export const API_ENDPOINT_VERSION_32 = 'v32';

export const API_ENDPOINT_VERSION_33 = 'v33';

export const API_ENDPOINT_VERSION_34 = 'v34';

export const API_ENDPOINT_VERSION_35 = 'v35';

export const API_ENDPOINT_VERSION_36 = 'v36';

export const API_ENDPOINT_VERSION_37 = 'v37';

export const API_ENDPOINT_VERSION_38 = 'v38';

export const API_ENDPOINT_VERSION_39 = 'v39';

export const API_ENDPOINT_VERSION_40 = 'v40';
