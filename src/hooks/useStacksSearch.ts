// useStacksSearch: search the Stacks blockchain by address, txid, or contract
import { useState, useCallback } from 'react';

export type SearchResultType = 'tx_id' | 'contract_address' | 'standard_address' | 'block_hash' | 'unknown';

export interface SearchResult {
  entity_type: SearchResultType;
  entity_id: string;
  found: boolean;
  metadata?: Record<string, unknown>;
}

export interface SearchState {
  result: SearchResult | null;
  isLoading: boolean;
  error: string | null;
}

async function searchStacksById(id: string): Promise<SearchResult> {
  const res = await fetch(`https://api.hiro.so/extended/v1/search/${id}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json() as Promise<SearchResult>;
}
