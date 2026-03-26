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

function loadSessionFromStorage(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

function saveSessionToStorage(user: SessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
