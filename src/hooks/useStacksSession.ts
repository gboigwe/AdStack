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

function clearSessionFromStorage(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function useStacksSession() {
  const [state, setState] = useState<StacksSessionState>({
    user: null,
    isConnected: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const stored = loadSessionFromStorage();
    setState({ user: stored, isConnected: !!stored, isLoading: false, error: null });
  }, []);

  const connect = useCallback((user: SessionUser) => {
    saveSessionToStorage(user);
    setState({ user, isConnected: true, isLoading: false, error: null });
  }, []);

  const disconnect = useCallback(() => {
    clearSessionFromStorage();
    setState({ user: null, isConnected: false, isLoading: false, error: null });
  }, []);
