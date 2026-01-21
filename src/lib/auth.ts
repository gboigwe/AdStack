/**
 * Stacks Authentication with Gaia Storage
 * Handles user authentication and session management
 */

import { AppConfig, UserSession, showConnect } from '@stacks/auth';
import { Storage } from '@stacks/storage';
import { Person } from '@stacks/profile';
import { setStorageUserSession } from './gaia-config';

// App configuration
const appConfig = new AppConfig(
  ['store_write', 'publish_data'],
  process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000'
);

// Create user session
let userSession: UserSession | null = null;

export function getUserSession(): UserSession {
  if (!userSession) {
    userSession = new UserSession({ appConfig });
  }
  return userSession;
}

// Authentication state
export interface AuthState {
  isAuthenticated: boolean;
  userSession: UserSession | null;
  userData: any | null;
  profile: Person | null;
  appPrivateKey: string | null;
  identityAddress: string | null;
  decentralizedID: string | null;
}

// Get current authentication state
export function getAuthState(): AuthState {
  const session = getUserSession();
  const isAuthenticated = session.isUserSignedIn();

  if (!isAuthenticated) {
    return {
      isAuthenticated: false,
      userSession: null,
      userData: null,
      profile: null,
      appPrivateKey: null,
      identityAddress: null,
      decentralizedID: null
    };
  }

  const userData = session.loadUserData();
  const profile = userData.profile ? new Person(userData.profile) : null;

  return {
    isAuthenticated: true,
    userSession: session,
    userData,
    profile,
    appPrivateKey: userData.appPrivateKey,
    identityAddress: userData.identityAddress,
    decentralizedID: userData.decentralizedID
  };
}

// Connect wallet and authenticate
export async function connectWallet(options?: {
  onFinish?: (userData: any) => void;
  onCancel?: () => void;
  redirectTo?: string;
}): Promise<void> {
  const session = getUserSession();

  showConnect({
    appDetails: {
      name: 'AdStack',
      icon: `${process.env.NEXT_PUBLIC_APP_DOMAIN}/logo.png`
    },
    redirectTo: options?.redirectTo || '/',
    onFinish: (userData) => {
      // Initialize storage with user session
      setStorageUserSession(session);

      // Call custom onFinish handler
      if (options?.onFinish) {
        options.onFinish(userData);
      }
    },
    onCancel: () => {
      if (options?.onCancel) {
        options.onCancel();
      }
    },
    userSession: session
  });
}

// Sign out user
export function signOut(): void {
  const session = getUserSession();
  session.signUserOut();

  // Clear storage instance
  setStorageUserSession(undefined);

  // Redirect to home
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}

// Check if authentication is pending
export function isAuthPending(): boolean {
  const session = getUserSession();
  return session.isSignInPending();
}

// Handle pending authentication
export async function handlePendingAuth(): Promise<any> {
  const session = getUserSession();

  if (!session.isSignInPending()) {
    return null;
  }

  try {
    const userData = await session.handlePendingSignIn();

    // Initialize storage with user session
    setStorageUserSession(session);

    return userData;
  } catch (error) {
    console.error('Error handling pending auth:', error);
    throw error;
  }
}

// Get user's Gaia hub config
export function getGaiaHubConfig(): any {
  const session = getUserSession();

  if (!session.isUserSignedIn()) {
    throw new Error('User not authenticated');
  }

  const userData = session.loadUserData();
  return userData.gaiaHubConfig;
}

// Get user's app private key
export function getAppPrivateKey(): string {
  const session = getUserSession();

  if (!session.isUserSignedIn()) {
    throw new Error('User not authenticated');
  }

  const userData = session.loadUserData();
  return userData.appPrivateKey;
}

// Get user's identity address
export function getIdentityAddress(): string {
  const session = getUserSession();

  if (!session.isUserSignedIn()) {
    throw new Error('User not authenticated');
  }

  const userData = session.loadUserData();
  return userData.identityAddress;
}

// Get user's decentralized ID
export function getDecentralizedID(): string {
  const session = getUserSession();

  if (!session.isUserSignedIn()) {
    throw new Error('User not authenticated');
  }

  const userData = session.loadUserData();
  return userData.decentralizedID || userData.username || '';
}

// Get user's profile
export function getUserProfile(): Person | null {
  const session = getUserSession();

  if (!session.isUserSignedIn()) {
    return null;
  }

  const userData = session.loadUserData();
  if (!userData.profile) {
    return null;
  }

  return new Person(userData.profile);
}

// Get user's username
export function getUsername(): string | null {
  const session = getUserSession();

  if (!session.isUserSignedIn()) {
    return null;
  }

  const userData = session.loadUserData();
  return userData.username || null;
}

// Check if user has specific scope
export function hasScope(scope: string): boolean {
  const session = getUserSession();

  if (!session.isUserSignedIn()) {
    return false;
  }

  const userData = session.loadUserData();
  return userData.authResponseToken?.includes(scope) || false;
}

// Session persistence helpers
export function saveSessionToLocalStorage(): void {
  const session = getUserSession();

  if (typeof window === 'undefined') return;

  const userData = session.isUserSignedIn() ? session.loadUserData() : null;

  if (userData) {
    localStorage.setItem('adstack_session', JSON.stringify({
      timestamp: Date.now(),
      userData
    }));
  }
}

export function loadSessionFromLocalStorage(): any | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('adstack_session');
    if (!stored) return null;

    const { timestamp, userData } = JSON.parse(stored);

    // Check if session is less than 30 days old
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > thirtyDays) {
      localStorage.removeItem('adstack_session');
      return null;
    }

    return userData;
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
}

export function clearSessionFromLocalStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('adstack_session');
}

// Export default authentication object
export const auth = {
  getUserSession,
  getAuthState,
  connectWallet,
  signOut,
  isAuthPending,
  handlePendingAuth,
  getGaiaHubConfig,
  getAppPrivateKey,
  getIdentityAddress,
  getDecentralizedID,
  getUserProfile,
  getUsername,
  hasScope,
  saveSessionToLocalStorage,
  loadSessionFromLocalStorage,
  clearSessionFromLocalStorage
};

export default auth;
