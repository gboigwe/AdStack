'use client';

import { useEffect, createContext, useContext, type ReactNode } from 'react';
import { useNetworkStatus, useServiceWorker } from '@/hooks/usePWA';
import { OfflineBanner } from './OfflineFallback';
import { InstallPrompt } from './InstallPrompt';
import { UpdateNotification } from './UpdateNotification';
import { startAutoSync } from '@/lib/background-sync';

interface PWAContextValue {
  isOnline: boolean;
  effectiveType: string | null;
  swStatus: 'idle' | 'registering' | 'ready' | 'error';
  updateAvailable: boolean;
  applyUpdate: () => void;
}

const PWAContext = createContext<PWAContextValue>({
  isOnline: true,
  effectiveType: null,
  swStatus: 'idle',
  updateAvailable: false,
  applyUpdate: () => {},
});

export function usePWAContext() {
  return useContext(PWAContext);
}

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const network = useNetworkStatus();
  const sw = useServiceWorker();

  useEffect(() => {
    const cleanup = startAutoSync();
    return cleanup;
  }, []);

  useEffect(() => {
    if (sw.status === 'ready' && sw.registration) {
      const interval = setInterval(() => {
        sw.registration?.update();
      }, 60 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [sw.status, sw.registration]);

  const value: PWAContextValue = {
    isOnline: network.isOnline,
    effectiveType: network.effectiveType,
    swStatus: sw.status,
    updateAvailable: sw.updateAvailable,
    applyUpdate: sw.applyUpdate,
  };

  return (
    <PWAContext.Provider value={value}>
      <OfflineBanner isOnline={network.isOnline} />
      {children}
      <InstallPrompt />
      <UpdateNotification />
    </PWAContext.Provider>
  );
}
