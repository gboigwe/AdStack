// useNetworkStatusV2: poll Stacks network status and chain info
import { useState, useEffect, useRef, useCallback } from 'react';

export interface NetworkInfo {
  server_version: string;
  network_id: number;
  parent_network_id: number;
  stacks_tip_height: number;
  stacks_tip: string;
  stacks_tip_consensus_hash: string;
  burn_block_height: number;
}

export interface NetworkStatusState {
  info: NetworkInfo | null;
  isOnline: boolean;
  isLoading: boolean;
  lastUpdated: number | null;
  error: string | null;
}
