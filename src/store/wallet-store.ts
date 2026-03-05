'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WalletStore {
  address: string | null;
  isConnected: boolean;
  setAddress: (address: string | null) => void;
  setConnected: (connected: boolean) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      address: null,
      isConnected: false,
      setAddress: (address) => set({ address }),
      setConnected: (connected) => set({ isConnected: connected }),
      disconnect: () => set({ address: null, isConnected: false }),
    }),
    {
      name: 'wallet-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        } as any)
      ),
    }
  )
);
