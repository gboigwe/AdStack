// Hiro API blocks endpoints
import { HIRO_API_BASE, HIRO_TESTNET_BASE, Network } from './accounts-api';

export type Block = { hash: string; height: number; burn_block_time: number; burn_block_hash: string; miner_txid: string; tx_count: number };

export type BlocksResponse = { limit: number; offset: number; total: number; results: Block[] };

export type BurnBlock = { burn_block_hash: string; burn_block_height: number; stacks_blocks: string[] };
