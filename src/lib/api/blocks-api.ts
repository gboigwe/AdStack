// Hiro API blocks endpoints
import { HIRO_API_BASE, HIRO_TESTNET_BASE, Network } from './accounts-api';

export type Block = { hash: string; height: number; burn_block_time: number; burn_block_hash: string; miner_txid: string; tx_count: number };
