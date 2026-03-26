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
