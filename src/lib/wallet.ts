'use client';

import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { APP_DETAILS, CURRENT_NETWORK } from './stacks-config';
import { parseStacksError, ErrorCode, createStacksError } from './error-handler';

/**
 * App configuration for Stacks Connect (v7+ compatible)
 */
const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

export interface WalletData {
  address: string;
  isConnected: boolean;
  network: string;
}

/**
 * Connect wallet using Stacks Connect v7+ API
 * Handles errors gracefully and returns structured error on failure
 * @returns Promise that resolves when wallet is connected
 * @throws StacksError if user cancels or connection fails
 */
export const connectWallet = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      showConnect({
        appDetails: APP_DETAILS,
        onFinish: () => {
          resolve();
        },
        onCancel: () => {
          const error = createStacksError(
            ErrorCode.USER_REJECTED,
            'User cancelled wallet connection'
          );
          reject(error);
        },
        userSession,
      });
    } catch (error) {
      const parsedError = parseStacksError(error);
      reject(parsedError);
    }
  });
};

/**
 * Disconnect wallet, clear session data, and reset state
 * Catches and logs any errors during sign-out to prevent crashes
 */
export const disconnectWallet = (): void => {
  try {
    userSession.signUserOut();
  } catch (error) {
    console.error('Error disconnecting wallet:', parseStacksError(error));
  }
};

/**
 * Get current wallet address for the active network
 * @returns The user's Stacks address for the current network, or null if not connected
 */
export const getWalletAddress = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const profile = userData.profile;

      // Return address based on current network
      if (CURRENT_NETWORK === 'mainnet') {
        return profile.stxAddress.mainnet;
      } else {
        return profile.stxAddress.testnet;
      }
    }
  } catch (error) {
    console.error('Error getting wallet address:', parseStacksError(error));
  }

  return null;
};

/**
 * Check if the user currently has an active wallet session
 * @returns True if the user is signed in with a Stacks wallet
 */
export const isWalletConnected = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    return userSession.isUserSignedIn();
  } catch (error) {
    console.error('Error checking wallet connection:', parseStacksError(error));
    return false;
  }
};

/**
 * Get full wallet data including connection status and network
 * @returns WalletData object with address, connection state, and network
 */
export const getWalletData = (): WalletData => {
  return {
    address: getWalletAddress() || '',
    isConnected: isWalletConnected(),
    network: CURRENT_NETWORK,
  };
};
