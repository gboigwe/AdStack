/**
 * stacks-hooks-index.ts
 * Barrel export for all Stacks blockchain integration React hooks.
 *
 * Usage:
 *   import { useStacksNetwork, useWalletAuth, useSTXPrice } from '@/hooks/stacks-hooks-index';
 */

// Network
export { useStacksNetwork, useBlockHeight } from './use-stacks-network';

// Wallet / Auth
export { useWalletAuth, useConnectedAddress } from './use-wallet-auth';

// Connect
export {
  useContractCallConnect,
  useSTXTransferConnect,
  useStacksConnect,
} from './use-stacks-connect';

// Balance
export { useEnhancedSTXBalance, useHasSufficientBalance } from './use-stx-balance-v2';

// Price
export { useSTXPrice, useSTXUSDPrice } from './use-stx-price';

// Nonce
export { useAccountNonce } from './use-account-nonce';

// Transactions
export { usePendingTransactions } from './use-pending-transactions';
export { useTransactionHistory, useAdStackTransactionHistory } from './use-transaction-history';

// Events
export { useCampaignEvents, useCampaignEventsByCampaign } from './use-campaign-events';
export {
  useEventIndex,
  useCampaignIndexedEvents,
  useCampaignCreatedCount,
} from './use-event-index';

// Campaign
export { useDeployTime, useContractVersion } from './use-campaign';

// Contract Introspection
export { useContractInterface } from './use-contract-interface';

// Budget
export { useBudgetTracker, useBudgetAlert } from './use-budget-tracker';
