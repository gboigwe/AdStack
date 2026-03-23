'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useWalletStore } from '@/store/wallet-store';
import { useWalletSession } from '@/hooks/use-wallet-session';

interface AppKitContextValue {
  isInitialized: boolean;
}

const AppKitContext = createContext<AppKitContextValue>({ isInitialized: false });

export function AppKitProvider({ children }: { children: ReactNode }) {
  const { setAddress, setConnected } = useWalletStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Monitor session expiry and update activity on focus
  useWalletSession();

  useEffect(() => {
    const init = async () => {
      try {
        const { autoReconnectWallet } = await import('@/lib/wallet-session');
        const result = await autoReconnectWallet();
        if (result.success && result.address) {
          setAddress(result.address);
          setConnected(true);
        }
      } catch {
        // Initialization failed — proceed without auto-connect
      } finally {
        setIsInitialized(true);
      }
    };
    init();
  }, [setAddress, setConnected]);

  return (
    <AppKitContext.Provider value={{ isInitialized }}>
      {children}
    </AppKitContext.Provider>
  );
}

export function useAppKit() {
  return useContext(AppKitContext);
}
