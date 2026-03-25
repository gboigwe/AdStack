/**
 * wallet-auth.ts
 * Stacks wallet authentication state management.
 * Handles wallet connection, session persistence,
 * and principal address resolution.
 */

import { showConnect, disconnect, isConnected } from '@stacks/connect';
import { APP_DETAILS } from './stacks-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WalletType = 'leather' | 'xverse' | 'unknown';

export interface WalletSession {
  address: string;
  testnetAddress?: string;
  mainnetAddress: string;
  walletType: WalletType;
  connectedAt: number;
}

// ---------------------------------------------------------------------------
// Session Storage
// ---------------------------------------------------------------------------

const SESSION_KEY = 'adstack_wallet_session';

export function saveWalletSession(session: WalletSession): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable
  }
}

export function loadWalletSession(): WalletSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearWalletSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable
  }
}

// ---------------------------------------------------------------------------
// Wallet Connection
// ---------------------------------------------------------------------------

/**
 * Open the Stacks Connect wallet chooser.
 * Calls onFinish with the authenticated address on success.
 */
export function openWalletConnect(options: {
  onFinish: (session: WalletSession) => void;
  onCancel?: () => void;
  network?: 'mainnet' | 'testnet' | 'devnet';
}): void {
  showConnect({
    appDetails: APP_DETAILS,
    onFinish: (authData) => {
      const profile = authData.userSession?.loadUserData();

      const mainnetAddress = profile?.profile?.stxAddress?.mainnet ?? '';
      const testnetAddress = profile?.profile?.stxAddress?.testnet;

      const address = options.network === 'testnet'
        ? (testnetAddress ?? mainnetAddress)
        : mainnetAddress;

      const session: WalletSession = {
        address,
        mainnetAddress,
        testnetAddress,
        walletType: detectWalletType(),
        connectedAt: Date.now(),
      };

      saveWalletSession(session);
      options.onFinish(session);
    },
    onCancel: options.onCancel,
  });
}

/**
 * Disconnect the currently connected wallet.
 */
export function disconnectWallet(): void {
  clearWalletSession();
  try {
    disconnect();
  } catch {
    // Stacks Connect may not be available
  }
}

/**
 * Check if a wallet is currently connected.
 */
export function checkWalletConnected(): boolean {
  try {
    return isConnected();
  } catch {
    return loadWalletSession() !== null;
  }
}

// ---------------------------------------------------------------------------
// Wallet Detection
// ---------------------------------------------------------------------------

function detectWalletType(): WalletType {
  if (typeof window === 'undefined') return 'unknown';

  if ((window as any).LeatherProvider) return 'leather';
  if ((window as any).XverseProviders) return 'xverse';

  return 'unknown';
}

/**
 * Get installed wallet providers.
 */
export function getInstalledWallets(): WalletType[] {
  if (typeof window === 'undefined') return [];
  const wallets: WalletType[] = [];
  if ((window as any).LeatherProvider) wallets.push('leather');
  if ((window as any).XverseProviders) wallets.push('xverse');
  return wallets;
}
