'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useWalletStore } from '@/store/wallet-store';

interface AppKitContextValue {
  isInitialized: boolean;
}

const AppKitContext = createContext<AppKitContextValue>({ isInitialized: true });

export function AppKitProvider({ children }: { children: ReactNode }) {
  const { setAddress, setConnected } = useWalletStore();

  useEffect(() => {
    const init = async () => {
      const { userSession } = await import('@/lib/wallet');
      const { CURRENT_NETWORK } = await import('@/lib/stacks-config');

      if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        const address =
          CURRENT_NETWORK === 'mainnet'
            ? userData.profile.stxAddress.mainnet
            : userData.profile.stxAddress.testnet;
        setAddress(address);
        setConnected(true);
      }
    };
    init();
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
