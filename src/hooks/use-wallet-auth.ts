/**
 * use-wallet-auth.ts
 * React hook for Stacks wallet connection state.
 * Wraps wallet-auth.ts with React state management and
 * exposes connect/disconnect actions.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  WalletSession,
  WalletType,
  loadWalletSession,
  openWalletConnect,
  disconnectWallet,
  checkWalletConnected,
  getInstalledWallets,
} from '@/lib/wallet-auth';
import { resolveNetwork, SupportedNetwork } from '@/lib/stacks-network';

export interface WalletAuthState {
  session: WalletSession | null;
  address: string | undefined;
  isConnected: boolean;
  walletType: WalletType;
  installedWallets: WalletType[];
  loading: boolean;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Hook for managing Stacks wallet authentication state.
 * Persists connection across page refreshes via sessionStorage.
 */
export function useWalletAuth(): WalletAuthState {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    const existing = loadWalletSession();
    if (existing && checkWalletConnected()) {
      setSession(existing);
    }
    setLoading(false);
  }, []);

  const network = resolveNetwork() as SupportedNetwork;

  const connect = useCallback(() => {
    openWalletConnect({
      network: network === 'devnet' ? 'testnet' : network,
      onFinish: (newSession) => {
        setSession(newSession);
      },
    });
  }, [network]);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setSession(null);
  }, []);

  return {
    session,
    address: session?.address,
    isConnected: session !== null,
    walletType: session?.walletType ?? 'unknown',
    installedWallets: getInstalledWallets(),
    loading,
    connect,
    disconnect,
  };
}

/**
 * Hook that returns only the connected address (or undefined).
 * Minimal version for components that just need the address.
 */
export function useConnectedAddress(): string | undefined {
  const { address } = useWalletAuth();
  return address;
}
