/**
 * Wallet Components Export Index
 * Centralized exports for all wallet-related components
 */

// Modal Components
export { WalletModal, WalletConnectButton } from './WalletModal';

// Account Management
export { AccountSwitcher } from './AccountSwitcher';

// Portfolio Views
export { WalletBalance } from './WalletBalance';
export { TransactionHistory } from './TransactionHistory';
export { NFTGallery } from './NFTGallery';

// Re-export types and utilities for convenience
export type { WalletSession } from '@/lib/wallet-session';
export { WalletEvent } from '@/lib/wallet-analytics';
