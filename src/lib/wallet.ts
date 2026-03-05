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
 * Connect wallet using Stacks Connect v7+
 * Handles errors gracefully with user-friendly messages
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
 * Disconnect wallet and clear session
 */
export const disconnectWallet = (): void => {
  try {
    userSession.signUserOut();
  } catch (error) {
    console.error('Error disconnecting wallet:', parseStacksError(error));
  }
};

/**
 * Get current wallet address
 * Returns mainnet or testnet address based on network config
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
 * Check if wallet is connected
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
 * Get full wallet data including network info
 */
export const getWalletData = (): WalletData => {
  return {
    address: getWalletAddress() || '',
    isConnected: isWalletConnected(),
    network: CURRENT_NETWORK,
  };
};
