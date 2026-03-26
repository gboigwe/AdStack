// Hiro API search endpoints
import { HIRO_API_BASE, HIRO_TESTNET_BASE, Network } from './accounts-api';

export type SearchResultType = 'tx' | 'block' | 'contract_address' | 'standard_address';

export type SearchResult = { found: boolean; result: { entity_type: SearchResultType; entity_id: string } | null };

function getBase(network: Network): string {
  return network === 'mainnet' ? HIRO_API_BASE : HIRO_TESTNET_BASE;
}

export async function searchById(id: string, network: Network = 'mainnet'): Promise<SearchResult> {
  const url = `${getBase(network)}/extended/v1/search/${id}`;
  const res = await fetch(url);
  if (!res.ok) return { found: false, result: null };
  return res.json();
}

export async function isValidAddress(address: string, network: Network = 'mainnet'): Promise<boolean> {
  const result = await searchById(address, network);
  return result.found && (result.result?.entity_type === 'standard_address' || result.result?.entity_type === 'contract_address');
}
