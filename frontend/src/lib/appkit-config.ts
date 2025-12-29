/**
 * Reown AppKit Configuration for Stacks Blockchain
 * Integrates Stacks.js with Reown AppKit for multi-wallet support
 */

import { UniversalProvider } from '@reown/appkit-universal-connector';
import { CURRENT_NETWORK, STACKS_MAINNET, STACKS_TESTNET, APP_DETAILS } from './stacks-config';

/**
 * WalletConnect Project ID
 * Get yours at https://cloud.reown.com/
 */
export const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

/**
 * Stacks Chain Configuration for Reown AppKit
 * Using CAIP-2 format: namespace:reference
 */
export const STACKS_CHAIN_CONFIG = {
  mainnet: {
    id: 'stacks:1', // CAIP-2 network identifier
    name: 'Stacks',
    nativeCurrency: {
      name: 'Stacks',
      symbol: 'STX',
      decimals: 6, // Micro-STX
    },
    rpcUrls: {
      default: {
        http: ['https://api.hiro.so'],
      },
      public: {
        http: ['https://api.hiro.so'],
      },
    },
    blockExplorers: {
      default: {
        name: 'Stacks Explorer',
        url: 'https://explorer.hiro.so',
      },
    },
    testnet: false,
  },
  testnet: {
    id: 'stacks:2147483648', // CAIP-2 for testnet
    name: 'Stacks Testnet',
    nativeCurrency: {
      name: 'Stacks',
      symbol: 'STX',
      decimals: 6,
    },
    rpcUrls: {
      default: {
        http: ['https://api.testnet.hiro.so'],
      },
      public: {
        http: ['https://api.testnet.hiro.so'],
      },
    },
    blockExplorers: {
      default: {
        name: 'Stacks Testnet Explorer',
        url: 'https://explorer.hiro.so/?chain=testnet',
      },
    },
    testnet: true,
  },
};

/**
 * Get current Stacks chain configuration
 */
export function getCurrentStacksChain() {
  return CURRENT_NETWORK === 'mainnet'
    ? STACKS_CHAIN_CONFIG.mainnet
    : STACKS_CHAIN_CONFIG.testnet;
}

/**
 * Supported Stacks Wallets
 */
export const SUPPORTED_WALLETS = [
  {
    id: 'leather',
    name: 'Leather Wallet',
    homepage: 'https://leather.io',
    description: 'The only wallet you need for Bitcoin and crypto',
    mobile: {
      native: 'leather://',
      universal: 'https://leather.io',
    },
    desktop: {
      native: 'leather://',
      universal: 'https://leather.io',
    },
  },
  {
    id: 'xverse',
    name: 'Xverse',
    homepage: 'https://xverse.app',
    description: 'Bitcoin and Stacks wallet for everyone',
    mobile: {
      native: 'xverse://',
      universal: 'https://xverse.app',
    },
    desktop: {
      native: 'xverse://',
      universal: 'https://xverse.app',
    },
  },
  {
    id: 'hiro',
    name: 'Hiro Wallet',
    homepage: 'https://wallet.hiro.so',
    description: 'The original Stacks wallet',
    desktop: {
      native: 'hiro://',
      universal: 'https://wallet.hiro.so',
    },
  },
  {
    id: 'boom',
    name: 'BOOM Wallet',
    homepage: 'https://boom.money',
    description: 'Mobile-first Bitcoin and Stacks wallet',
    mobile: {
      native: 'boom://',
      universal: 'https://boom.money',
    },
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    homepage: 'https://okx.com/web3',
    description: 'Multi-chain wallet with Stacks support',
    mobile: {
      native: 'okx://',
      universal: 'https://okx.com/web3',
    },
    desktop: {
      native: 'okx://',
      universal: 'https://okx.com/web3',
    },
  },
];

/**
 * AppKit Metadata
 */
export const APPKIT_METADATA = {
  name: APP_DETAILS.name,
  description: APP_DETAILS.description || 'Decentralized Advertising on Stacks',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://adstack.app',
  icons: APP_DETAILS.icon ? [APP_DETAILS.icon] : [],
};

/**
 * Reown AppKit Configuration Options
 */
export interface AppKitConfig {
  projectId: string;
  metadata: typeof APPKIT_METADATA;
  chains: typeof STACKS_CHAIN_CONFIG;
  wallets: typeof SUPPORTED_WALLETS;
  themeMode?: 'light' | 'dark' | 'auto';
  themeVariables?: {
    '--w3m-accent'?: string;
    '--w3m-border-radius-master'?: string;
  };
}

/**
 * Get AppKit configuration
 */
export function getAppKitConfig(): AppKitConfig {
  return {
    projectId: WALLETCONNECT_PROJECT_ID,
    metadata: APPKIT_METADATA,
    chains: STACKS_CHAIN_CONFIG,
    wallets: SUPPORTED_WALLETS,
    themeMode: 'auto',
    themeVariables: {
      '--w3m-accent': '#5546FF', // Stacks purple
      '--w3m-border-radius-master': '8px',
    },
  };
}

/**
 * Network configuration for WalletConnect
 */
export const WALLETCONNECT_NETWORKS = {
  stacks: getCurrentStacksChain(),
};

/**
 * AppKit Features Configuration
 */
export const APPKIT_FEATURES = {
  analytics: true, // Track wallet connections
  email: false, // Email login not supported for Stacks yet
  socials: [], // Social logins not supported
  onramp: false, // On-ramp not integrated yet
  swaps: false, // Swaps not integrated yet
};

/**
 * Session Storage Keys
 */
export const SESSION_KEYS = {
  WALLET_ID: 'adstack_wallet_id',
  WALLET_ADDRESS: 'adstack_wallet_address',
  NETWORK: 'adstack_network',
  SESSION_SIGNATURE: 'adstack_session_sig',
};
