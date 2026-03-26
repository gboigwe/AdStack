// Hiro API transactions endpoints
import { HIRO_API_BASE, HIRO_TESTNET_BASE, Network } from './accounts-api';

export type Transaction = { tx_id: string; tx_type: string; tx_status: string; block_height: number; sender_address: string; fee_rate: string; nonce: number };

export type MempoolTransaction = { tx_id: string; tx_type: string; receipt_time: number; sender_address: string; fee_rate: string };

export type BroadcastResponse = { txid: string } | { error: string; reason: string };

export type FeeEstimateResponse = { estimated_cost: { read_count: number; read_length: number; runtime: number; write_count: number; write_length: number }; estimated_cost_scalar: number; estimations: FeeEstimation[] };

export type FeeEstimation = { fee_rate: number; fee: number };

function getBase(network: Network): string {
  return network === 'mainnet' ? HIRO_API_BASE : HIRO_TESTNET_BASE;
}

export async function fetchTransaction(txId: string, network: Network = 'mainnet'): Promise<Transaction> {
  const url = `${getBase(network)}/extended/v1/tx/${txId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch tx: ${res.status}`);
  return res.json();
}
