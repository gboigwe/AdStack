/**
 * Wallet Session Management
 * Handles persistent wallet sessions and reconnection
 */

import { userSession } from './wallet';
import { SESSION_KEYS } from './appkit-config';
import { CURRENT_NETWORK } from './stacks-config';

/** Maximum session age before automatic expiry (30 days in ms). */
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Interval between background session expiry checks (5 minutes in ms). */
const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;

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
    // Single-source storage — the JSON blob is authoritative.
    // Individual keys are written for quick lookups by other modules
    // but are always derived from the same session object to prevent
    // the previous desync issue where keys could diverge from the blob.
    const json = JSON.stringify(session);
    localStorage.setItem('adstack_wallet_session', json);
    localStorage.setItem(SESSION_KEYS.WALLET_ADDRESS, session.address);
    localStorage.setItem(SESSION_KEYS.WALLET_ID, session.walletId);
    localStorage.setItem(SESSION_KEYS.NETWORK, session.network);
    if (session.signature) {
      localStorage.setItem(SESSION_KEYS.SESSION_SIGNATURE, session.signature);
    } else {
      localStorage.removeItem(SESSION_KEYS.SESSION_SIGNATURE);
    }
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
  return Date.now() - session.lastActiveAt < SESSION_MAX_AGE_MS;
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
      const address = CURRENT_NETWORK === 'mainnet'
        ? userData.profile.stxAddress.mainnet
        : userData.profile.stxAddress.testnet;

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
 * Generate a session token by hashing the address, timestamp, and a
 * browser-local secret. The secret is generated once per browser and
 * stored in localStorage so it survives page reloads but cannot be
 * predicted by a remote attacker.
 */
function getOrCreateSessionSecret(): string {
  const KEY = 'adstack_session_secret';
  if (typeof window === 'undefined') return '';
  let secret = localStorage.getItem(KEY);
  if (!secret) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    secret = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(KEY, secret);
  }
  return secret;
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a session token bound to a specific address and timestamp.
 * The token is an HMAC-SHA256 digest so it cannot be forged without
 * the browser-local secret.
 */
export async function createSessionSignature(
  address: string,
  message?: string,
): Promise<string | null> {
  try {
    const secret = getOrCreateSessionSecret();
    if (!secret) return null;

    const timestamp = Date.now();
    const payload = message || `AdStack Session ${timestamp}`;
    const digest = await hmacSha256(secret, `${address}:${payload}`);

    return `${timestamp}:${digest}`;
  } catch (error) {
    console.error('Failed to create session signature:', error);
    return null;
  }
}

/**
 * Verify a session token by recomputing the HMAC and comparing in
 * constant time (via subtle.verify) to prevent timing attacks.
 */
export async function verifySessionSignature(
  address: string,
  signature: string,
): Promise<boolean> {
  try {
    const secret = getOrCreateSessionSecret();
    if (!secret || !signature.includes(':')) return false;

    const parts = signature.split(':', 2);
    const timestampStr = parts[0] ?? '';
    const providedDigest = parts[1] ?? '';
    const timestamp = Number(timestampStr);
    if (Number.isNaN(timestamp)) return false;

    // Reject tokens older than 30 days
    const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > MAX_AGE_MS) return false;

    const payload = `AdStack Session ${timestamp}`;
    const expectedDigest = await hmacSha256(secret, `${address}:${payload}`);

    // Constant-length comparison to avoid timing leaks
    if (providedDigest.length !== expectedDigest.length) return false;
    let mismatch = 0;
    for (let i = 0; i < providedDigest.length; i++) {
      mismatch |= providedDigest.charCodeAt(i) ^ expectedDigest.charCodeAt(i);
    }
    return mismatch === 0;
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

  const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL_MS);

  // Return cleanup function
  return () => clearInterval(interval);
}
