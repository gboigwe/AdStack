// useAccountTokens: fetch FT and NFT holdings for a Stacks address
import { useState, useEffect, useCallback } from 'react';

export interface FtBalance {
  balance: string;
  total_sent: string;
  total_received: string;
}

export interface NftHolding {
  asset_identifier: string;
  value: { hex: string; repr: string };
  tx_id: string;
  block_height: number;
}

export interface AccountTokensState {
  fungible: Record<string, FtBalance>;
  nonFungible: NftHolding[];
  isLoading: boolean;
  error: string | null;
}

const BASE = 'https://api.hiro.so';

async function fetchFtBalances(address: string): Promise<Record<string, FtBalance>> {
  const res = await fetch(`${BASE}/v2/accounts/${address}/balances`);
  if (!res.ok) throw new Error(`FT fetch failed: ${res.status}`);
  const data = await res.json() as { fungible_tokens?: Record<string, FtBalance> };
  return data.fungible_tokens ?? {};
}

async function fetchNftHoldings(address: string): Promise<NftHolding[]> {
  const res = await fetch(`${BASE}/extended/v1/tokens/nft/holdings?principal=${address}&limit=50`);
  if (!res.ok) throw new Error(`NFT fetch failed: ${res.status}`);
  const data = await res.json() as { results?: NftHolding[] };
  return data.results ?? [];
}

export function useAccountTokens(address: string | null) {
  const [state, setState] = useState<AccountTokensState>({
    fungible: {}, nonFungible: [], isLoading: false, error: null,
  });
