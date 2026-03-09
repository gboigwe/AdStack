/**
 * AdStack Library — barrel export.
 * Re-exports the most commonly used utilities so consumers can write:
 *   import { formatSTX, fetchStxBalance, buildCreateCampaign } from '@/lib';
 */

// Display & formatting
export {
  truncateAddress,
  formatSTX,
  formatSTXWithSymbol,
  formatCompactNumber,
  formatTimestamp,
  formatRelativeTime,
  formatTxId,
  formatPercentage,
  formatDuration,
  estimateBlockDate,
  copyToClipboard,
  formatCampaignStatus,
  getStatusColorClass,
} from './display-utils';

// Network & config
export {
  CURRENT_NETWORK,
  NETWORK,
  CONTRACT_ADDRESS,
  API_URL,
  CONTRACTS,
  MICRO_STX,
  BLOCK_TIME,
  TX_OPTIONS,
  APP_DETAILS,
  microStxToStx,
  stxToMicroStx,
  getContractId,
  isMainnet,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from './stacks-config';

// API client
export {
  fetchStxBalance,
  fetchTransactions,
  fetchTransaction,
  fetchBlockHeight,
  callReadOnlyFunction,
  healthCheck,
  getApiUrl,
  getNetworkName,
} from './stacks-api';

// Clarity value converters
export {
  toUIntCV,
  toIntCV,
  toBoolCV,
  toStringAsciiCV,
  toStringUtf8CV,
  toPrincipalCV,
  toListCV,
  toSomeCV,
  toNoneCV,
  cvToNumber,
  cvToBigInt,
  cvToString,
  cvToAddress,
  stacksBlockTimeToDate,
  dateToStacksBlockTime,
} from './clarity-converters';

// Post-conditions
export {
  PC_MODE,
  createSTXTransferExact,
  createSTXTransferMax,
  createContractSTXTransfer,
  createCampaignFundingPostConditions,
  createPublisherPayoutPostConditions,
} from './post-conditions';

// Contract call builders
export {
  buildCreateCampaign,
  buildPauseCampaign,
  buildResumeCampaign,
  buildRegisterUser,
  buildClaimPayout,
  buildSubmitView,
  buildCreateProposal,
  buildCastVote,
  buildReadCampaign,
  buildReadAnalytics,
  buildReadUserProfile,
} from './contract-calls';

// Address validation
export {
  isValidStacksAddress,
  isAddressForNetwork,
  isValidContractId,
} from './address-validation';

// Error handling
export {
  parseStacksError,
  getErrorMessage,
  createStacksError,
} from './error-handler';

// Request deduplication
export { deduplicatedFetch } from './request-cache';
