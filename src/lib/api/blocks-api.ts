// Hiro API blocks endpoints
import { HIRO_API_BASE, HIRO_TESTNET_BASE, Network } from './accounts-api';

export type Block = { hash: string; height: number; burn_block_time: number; burn_block_hash: string; miner_txid: string; tx_count: number };

export type BlocksResponse = { limit: number; offset: number; total: number; results: Block[] };

export type BurnBlock = { burn_block_hash: string; burn_block_height: number; stacks_blocks: string[] };

function getBase(network: Network): string {
  return network === 'mainnet' ? HIRO_API_BASE : HIRO_TESTNET_BASE;
}

export async function fetchLatestBlock(network: Network = 'mainnet'): Promise<Block> {
  const url = `${getBase(network)}/extended/v1/block?limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch latest block');
  const data = await res.json() as BlocksResponse;
  return data.results[0];
}

export async function fetchBlock(hashOrHeight: string | number, network: Network = 'mainnet'): Promise<Block> {
  const url = `${getBase(network)}/extended/v1/block/${hashOrHeight}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Block not found: ${hashOrHeight}`);
  return res.json();
}

export async function fetchRecentBlocks(limit = 10, network: Network = 'mainnet'): Promise<BlocksResponse> {
  const url = `${getBase(network)}/extended/v1/block?limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch blocks');
  return res.json();
}
