// useStacksSession: manage Stacks wallet session state
import { useState, useEffect, useCallback } from 'react';

export type StacksNetwork = 'mainnet' | 'testnet' | 'devnet';

export interface SessionUser {
  stxAddress: string;
  network: StacksNetwork;
  publicKey?: string;
}

export interface StacksSessionState {
  user: SessionUser | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

const SESSION_KEY = 'stacks_session_user';
