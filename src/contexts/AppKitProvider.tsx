'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useWalletStore } from '@/store/wallet-store';
import { userSession } from '@/lib/wallet';
import { CURRENT_NETWORK } from '@/lib/stacks-config';

interface AppKitContextValue {
  isInitialized: boolean;
}

const AppKitContext = createContext<AppKitContextValue>({ isInitialized: true });

export function AppKitProvider({ children }: { children: ReactNode }) {
  const { setAddress, setConnected } = useWalletStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const address =
        CURRENT_NETWORK === 'mainnet'
          ? userData.profile.stxAddress.mainnet
          : userData.profile.stxAddress.testnet;
      setAddress(address);
      setConnected(true);
    }
  }, [setAddress, setConnected]);

  return (
    <AppKitContext.Provider value={{ isInitialized: true }}>
      {children}
    </AppKitContext.Provider>
  );
}

export function useAppKit() {
  return useContext(AppKitContext);
}
