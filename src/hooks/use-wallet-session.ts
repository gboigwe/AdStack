'use client';

import { useEffect, useCallback } from 'react';
import { useWalletStore } from '@/store/wallet-store';
import {
  loadWalletSession,
  onSessionExpired,
  updateSessionActivity,
} from '@/lib/wallet-session';

/**
 * Hook that monitors wallet session validity and disconnects
 * automatically when the session expires.
 *
 * Should be used once near the root of the app (e.g. in Header or
 * AppKitProvider).
 */
export function useWalletSession() {
  const { isConnected, disconnect } = useWalletStore();

  const handleExpiry = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Register session expiry listener
  useEffect(() => {
    if (!isConnected) return;
    const cleanup = onSessionExpired(handleExpiry);
    return cleanup;
  }, [isConnected, handleExpiry]);

  // Update activity timestamp on window focus
  useEffect(() => {
    if (!isConnected) return;

    const handleFocus = () => updateSessionActivity();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isConnected]);

  return {
    session: isConnected ? loadWalletSession() : null,
  };
}
