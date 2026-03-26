// Hiro API token endpoints
import { HIRO_API_BASE, HIRO_TESTNET_BASE, Network } from './accounts-api';

export type FtInfo = { name: string; symbol: string; decimals: number; total_supply: string; token_uri: string; contract_id: string };

export type NftInfo = { asset_identifier: string; value: { hex: string; repr: string }; block_height: number; tx_id: string };

export type NftHoldingsResponse = { limit: number; offset: number; total: number; results: NftInfo[] };

export type FtHoldingsResponse = { limit: number; offset: number; total: number; results: FtInfo[] };

function getBase(network: Network): string {
  return network === 'mainnet' ? HIRO_API_BASE : HIRO_TESTNET_BASE;
}

export async function fetchFtInfo(contractId: string, network: Network = 'mainnet'): Promise<FtInfo> {
  const url = `${getBase(network)}/metadata/v1/ft/${contractId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FT not found: ${contractId}`);
  return res.json();
}

export async function fetchAddressNftHoldings(address: string, network: Network = 'mainnet'): Promise<NftHoldingsResponse> {
  const url = `${getBase(network)}/extended/v1/tokens/nft/holdings?principal=${address}`;
  const res = await fetch(url);
  if (!res.ok) return { limit: 0, offset: 0, total: 0, results: [] };
  return res.json();
}

export async function fetchNftEvents(assetIdentifier: string, network: Network = 'mainnet', limit = 20): Promise<NftInfo[]> {
  const url = `${getBase(network)}/extended/v1/tokens/nft/history?asset_identifier=${assetIdentifier}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}
