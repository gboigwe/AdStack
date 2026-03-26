// Hiro API accounts endpoints

export const HIRO_API_BASE = 'https://api.hiro.so';

export const HIRO_TESTNET_BASE = 'https://api.testnet.hiro.so';

export type Network = 'mainnet' | 'testnet';

export type AccountBalance = { stx: StxBalance; fungible_tokens: Record<string, FtBalance>; non_fungible_tokens: Record<string, NftHolding> };

export type StxBalance = { balance: string; total_sent: string; total_received: string; total_fees_sent: string; total_miner_rewards_received: string; lock_tx_id: string; locked: string; lock_height: number; burnchain_lock_height: number; burnchain_unlock_height: number };

export type FtBalance = { balance: string; total_sent: string; total_received: string };

export type NftHolding = { count: string; total_sent: string; total_received: string };

export type AccountTransaction = { tx_id: string; tx_type: string; block_height: number; burn_block_time: number };
