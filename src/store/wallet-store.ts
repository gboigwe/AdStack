'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const STORAGE_KEY = 'wallet-storage';

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
      name: STORAGE_KEY,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
    }
  )
);

/**
 * Sync wallet state across browser tabs via the storage event.
 * When another tab updates localStorage, this listener rehydrates
 * the store so all tabs reflect the same connection state.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;

    try {
      const parsed = JSON.parse(event.newValue);
      const state = parsed?.state;
      if (state) {
        useWalletStore.setState({
          address: state.address ?? null,
          isConnected: state.isConnected ?? false,
        });
      }
    } catch {
      // Ignore malformed storage data
    }
  });
}
