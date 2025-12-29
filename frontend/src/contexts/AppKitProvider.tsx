/**
 * Reown AppKit Provider for Stacks
 * Wraps the application with AppKit context and Stacks wallet integration
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createAppKit } from '@reown/appkit';
import { UniversalProvider } from '@reown/appkit-universal-connector';
import {
  getAppKitConfig,
  WALLETCONNECT_PROJECT_ID,
  APPKIT_METADATA,
  getCurrentStacksChain,
  SUPPORTED_WALLETS,
  SESSION_KEYS,
} from '@/lib/appkit-config';
import { useWalletStore } from '@/store/wallet-store';
import { userSession } from '@/lib/wallet';

/**
 * AppKit Context Interface
 */
interface AppKitContextValue {
  modal: any | null;
  provider: UniversalProvider | null;
  isInitialized: boolean;
  openModal: () => Promise<void>;
  closeModal: () => void;
  switchNetwork: (network: 'mainnet' | 'testnet') => Promise<void>;
}

const AppKitContext = createContext<AppKitContextValue | undefined>(undefined);

/**
 * AppKit Provider Props
 */
interface AppKitProviderProps {
  children: ReactNode;
}

/**
 * AppKit Provider Component
 */
export function AppKitProvider({ children }: AppKitProviderProps) {
  const [modal, setModal] = useState<any | null>(null);
  const [provider, setProvider] = useState<UniversalProvider | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { setAddress, setConnected, disconnect } = useWalletStore();

  useEffect(() => {
    const initializeAppKit = async () => {
      try {
        // Initialize Universal Provider
        const universalProvider = await UniversalProvider.init({
          projectId: WALLETCONNECT_PROJECT_ID,
          metadata: APPKIT_METADATA,
          logger: 'info',
        });

        setProvider(universalProvider);

        // Create AppKit modal
        const appKit = createAppKit({
          adapters: [universalProvider],
          projectId: WALLETCONNECT_PROJECT_ID,
          metadata: APPKIT_METADATA,
          networks: [getCurrentStacksChain()],
          themeMode: 'auto',
          themeVariables: {
            '--w3m-accent': '#5546FF',
            '--w3m-border-radius-master': '8px',
          },
          features: {
            analytics: true,
            email: false,
            socials: [],
          },
        } as any);

        setModal(appKit);
        setIsInitialized(true);

        // Listen for wallet connection events
        universalProvider.on('display_uri', (uri: string) => {
          console.log('WalletConnect URI:', uri);
        });

        universalProvider.on('session_event', (event: any) => {
          console.log('Session event:', event);
        });

        universalProvider.on('session_update', ({ topic, params }: any) => {
          console.log('Session updated:', topic, params);
        });

        universalProvider.on('session_delete', () => {
          console.log('Session deleted');
          handleDisconnect();
        });

        // Check for existing session
        if (universalProvider.session) {
          const accounts = universalProvider.session.namespaces?.stacks?.accounts || [];
          if (accounts.length > 0) {
            const address = accounts[0].split(':')[2]; // Extract address from CAIP-10
            setAddress(address);
            setConnected(true);
          }
        }

        // Also check Stacks Connect session
        if (userSession.isUserSignedIn()) {
          const userData = userSession.loadUserData();
          const address = userData.profile.stxAddress.mainnet;
          setAddress(address);
          setConnected(true);
        }
      } catch (error) {
        console.error('Failed to initialize AppKit:', error);
      }
    };

    initializeAppKit();

    return () => {
      // Cleanup
      if (provider) {
        provider.removeAllListeners();
      }
    };
  }, [setAddress, setConnected, disconnect]);

  /**
   * Open wallet modal
   */
  const openModal = async () => {
    if (modal) {
      await modal.open();
    }
  };

  /**
   * Close wallet modal
   */
  const closeModal = () => {
    if (modal) {
      modal.close();
    }
  };

  /**
   * Switch network
   */
  const switchNetwork = async (network: 'mainnet' | 'testnet') => {
    try {
      if (provider && provider.session) {
        // Update network in provider
        const chainId = network === 'mainnet' ? 'stacks:1' : 'stacks:2147483648';

        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId }],
        });

        console.log(`Switched to ${network}`);
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      throw error;
    }
  };

  /**
   * Handle disconnect
   */
  const handleDisconnect = () => {
    disconnect();
    if (provider && provider.session) {
      provider.disconnect();
    }
    // Clear session storage
    Object.values(SESSION_KEYS).forEach((key) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    });
  };

  const value: AppKitContextValue = {
    modal,
    provider,
    isInitialized,
    openModal,
    closeModal,
    switchNetwork,
  };

  return <AppKitContext.Provider value={value}>{children}</AppKitContext.Provider>;
}

/**
 * Hook to use AppKit context
 */
export function useAppKit() {
  const context = useContext(AppKitContext);
  if (!context) {
    throw new Error('useAppKit must be used within AppKitProvider');
  }
  return context;
}

/**
 * Hook to check if AppKit is ready
 */
export function useAppKitReady() {
  const { isInitialized } = useAppKit();
  return isInitialized;
}

/**
 * Hook to open wallet modal
 */
export function useWalletModal() {
  const { openModal, closeModal } = useAppKit();
  return { openModal, closeModal };
}

/**
 * Hook to switch network
 */
export function useNetworkSwitch() {
  const { switchNetwork } = useAppKit();
  return { switchNetwork };
}
