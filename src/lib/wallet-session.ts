/**
 * Wallet Session Management
 * Handles persistent wallet sessions and reconnection
 */

import { userSession } from './wallet';
import { SESSION_KEYS } from './appkit-config';

/**
 * Session Data Interface
 */
export interface WalletSession {
  address: string;
  walletId: string;
  network: 'mainnet' | 'testnet';
  connectedAt: number;
  lastActiveAt: number;
  signature?: string;
}

/**
 * Save wallet session to localStorage
 */
export function saveWalletSession(session: WalletSession): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(SESSION_KEYS.WALLET_ADDRESS, session.address);
    localStorage.setItem(SESSION_KEYS.WALLET_ID, session.walletId);
    localStorage.setItem(SESSION_KEYS.NETWORK, session.network);

    if (session.signature) {
      localStorage.setItem(SESSION_KEYS.SESSION_SIGNATURE, session.signature);
    }

    // Store full session as JSON
    localStorage.setItem('adstack_wallet_session', JSON.stringify(session));

    console.log('Wallet session saved:', session.address);
  } catch (error) {
    console.error('Failed to save wallet session:', error);
  }
}

/**
 * Load wallet session from localStorage
 */
export function loadWalletSession(): WalletSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const sessionData = localStorage.getItem('adstack_wallet_session');

    if (!sessionData) return null;

    const session = JSON.parse(sessionData) as WalletSession;

    // Validate session (not expired, etc.)
    if (isSessionValid(session)) {
      return session;
    } else {
      clearWalletSession();
      return null;
    }
  } catch (error) {
    console.error('Failed to load wallet session:', error);
    return null;
  }
}

/**
 * Check if session is valid
 */
export function isSessionValid(session: WalletSession): boolean {
  // Session expires after 30 days
  const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
  const now = Date.now();

  if (now - session.lastActiveAt > SESSION_EXPIRY) {
    return false;
  }

  return true;
}

/**
 * Update session activity timestamp
 */
export function updateSessionActivity(): void {
  if (typeof window === 'undefined') return;

  try {
    const sessionData = localStorage.getItem('adstack_wallet_session');
    if (!sessionData) return;

    const session = JSON.parse(sessionData) as WalletSession;
    session.lastActiveAt = Date.now();

    localStorage.setItem('adstack_wallet_session', JSON.stringify(session));
  } catch (error) {
    console.error('Failed to update session activity:', error);
  }
}

/**
 * Clear wallet session
 */
export function clearWalletSession(): void {
  if (typeof window === 'undefined') return;

  try {
    Object.values(SESSION_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });

    localStorage.removeItem('adstack_wallet_session');

    console.log('Wallet session cleared');
  } catch (error) {
    console.error('Failed to clear wallet session:', error);
  }
}

/**
 * Auto-reconnect wallet on app load
 */
export async function autoReconnectWallet(): Promise<{
  success: boolean;
  address?: string;
  error?: string;
}> {
  try {
    // First check if Stacks Connect has an active session
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const address = userData.profile.stxAddress.mainnet;

      // Update session activity
      updateSessionActivity();

      return {
        success: true,
        address,
      };
    }

    // Check for saved session
    const savedSession = loadWalletSession();

    if (savedSession) {
      // Session exists but Stacks Connect is not signed in
      // Clear the invalid session
      clearWalletSession();

      return {
        success: false,
        error: 'Session expired, please reconnect',
      };
    }

    return {
      success: false,
      error: 'No active session',
    };
  } catch (error) {
    console.error('Auto-reconnect failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Reconnection failed',
    };
  }
}

/**
 * Create session signature for verification
 */
export async function createSessionSignature(
  address: string,
  message?: string
): Promise<string | null> {
  try {
    // TODO: Implement actual signature using Stacks Connect
    // This would use the wallet to sign a message proving ownership
    const timestamp = Date.now();
    const sessionMessage = message || `AdStack Session ${timestamp}`;

    // Placeholder signature
    return `sig_${address.slice(0, 10)}_${timestamp}`;
  } catch (error) {
    console.error('Failed to create session signature:', error);
    return null;
  }
}

/**
 * Verify session signature
 */
export async function verifySessionSignature(
  address: string,
  signature: string
): Promise<boolean> {
  try {
    // TODO: Implement actual signature verification
    // This would verify the signature was created by the address owner

    // Placeholder verification
    return signature.startsWith(`sig_${address.slice(0, 10)}`);
  } catch (error) {
    console.error('Failed to verify session signature:', error);
    return false;
  }
}

/**
 * Get session info
 */
export function getSessionInfo(): {
  isActive: boolean;
  address?: string;
  walletId?: string;
  network?: string;
  connectedAt?: number;
} | null {
  const session = loadWalletSession();

  if (!session) {
    return null;
  }

  return {
    isActive: true,
    address: session.address,
    walletId: session.walletId,
    network: session.network,
    connectedAt: session.connectedAt,
  };
}

/**
 * Session event listeners
 */
export function onSessionExpired(callback: () => void): () => void {
  const checkSession = () => {
    const session = loadWalletSession();
    if (session && !isSessionValid(session)) {
      clearWalletSession();
      callback();
    }
  };

  // Check every 5 minutes
  const interval = setInterval(checkSession, 5 * 60 * 1000);

  // Return cleanup function
  return () => clearInterval(interval);
}
