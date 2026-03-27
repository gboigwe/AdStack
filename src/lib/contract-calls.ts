/**
 * Contract Call Builders for AdStack
 * Type-safe helpers for constructing Clarity contract calls.
 * Each function returns the arguments needed by openContractCall().
 */

import {
  CONTRACT_ADDRESS,
  CONTRACTS,
  getContractId,
  stxToMicroStx,
  BLOCK_TIME,
  CAMPAIGN_LIMITS,
} from './stacks-config';
import { toUIntCV, toStringAsciiCV, toPrincipalCV, toBoolCV } from './clarity-converters';
import {
  createCampaignFundingPostConditions,
  createPublisherPayoutPostConditions,
  PC_MODE,
} from './post-conditions';
import type { CreateCampaignParams, RegisterUserParams, CreateProposalParams } from '@/types/contracts';
import { UserRole } from '@/types/contracts';

/**
 * Map frontend UserRole enum values to on-chain uint constants.
 * Must stay in sync with user-profiles.clar ROLE_* constants.
 */
const ROLE_TO_UINT: Record<string, number> = {
  [UserRole.ADVERTISER]: 1,
  [UserRole.PUBLISHER]: 2,
  [UserRole.VIEWER]: 3,
};

/**
 * Build contract call options for creating a new campaign.
 * Calls promo-manager.create-campaign with budget, daily-budget, duration.
 */
export function buildCreateCampaign(
  senderAddress: string,
  params: CreateCampaignParams,
) {
  if (!senderAddress) throw new Error('buildCreateCampaign: senderAddress is required');
  if (!params.name || params.name.trim().length === 0) throw new Error('buildCreateCampaign: name is required and cannot be whitespace-only');
  if (params.name.length > CAMPAIGN_LIMITS.MAX_NAME_LENGTH) throw new Error(`buildCreateCampaign: name exceeds max length (${CAMPAIGN_LIMITS.MAX_NAME_LENGTH})`);
  if (Number(params.budget) <= 0) throw new Error('buildCreateCampaign: budget must be positive');
  if (Number(params.dailyBudget) <= 0) throw new Error('buildCreateCampaign: dailyBudget must be positive');
  if (Number(params.dailyBudget) > Number(params.budget)) throw new Error('buildCreateCampaign: dailyBudget cannot exceed total budget');
  if (params.duration < CAMPAIGN_LIMITS.MIN_DURATION_BLOCKS) throw new Error(`buildCreateCampaign: duration must be at least ${CAMPAIGN_LIMITS.MIN_DURATION_BLOCKS} blocks`);
  if (params.duration > CAMPAIGN_LIMITS.MAX_DURATION_BLOCKS) throw new Error(`buildCreateCampaign: duration exceeds max (${CAMPAIGN_LIMITS.MAX_DURATION_BLOCKS} blocks)`);

  const budgetMicro = stxToMicroStx(Number(params.budget));
  const dailyMicro = stxToMicroStx(Number(params.dailyBudget));

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'create-campaign',
    functionArgs: [
      toStringAsciiCV(params.name),
      toUIntCV(budgetMicro),
      toUIntCV(dailyMicro),
      toUIntCV(params.duration),
    ],
    postConditionMode: PC_MODE.DENY,
    postConditions: createCampaignFundingPostConditions(
      senderAddress,
      Number(params.budget),
    ),
  };
}

/**
 * Build contract call options for pausing a campaign.
 */
export function buildPauseCampaign(campaignId: number) {
  if (campaignId < 0) throw new Error('buildPauseCampaign: campaignId must be non-negative');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'pause-campaign',
    functionArgs: [toUIntCV(campaignId)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call options for resuming a paused campaign.
 */
export function buildResumeCampaign(campaignId: number) {
  if (campaignId < 0) throw new Error('buildResumeCampaign: campaignId must be non-negative');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'resume-campaign',
    functionArgs: [toUIntCV(campaignId)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call options for registering a user profile.
 * Calls user-profiles.register with role and display name.
 */
export function buildRegisterUser(params: RegisterUserParams) {
  if (!params.displayName || params.displayName.length === 0) throw new Error('buildRegisterUser: displayName is required');
  if (params.displayName.length > 48) throw new Error('buildRegisterUser: displayName exceeds max length (48)');

  const roleUint = ROLE_TO_UINT[params.role];
  if (roleUint === undefined) {
    throw new Error(`Invalid role: ${params.role}. Valid roles: ${Object.keys(ROLE_TO_UINT).join(', ')}`);
  }

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.USER_PROFILES,
    functionName: 'register',
    functionArgs: [
      toUIntCV(roleUint),
      toStringAsciiCV(params.displayName),
    ],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call options for cancelling a campaign.
 * Calls promo-manager.cancel-campaign to stop the campaign
 * and refund remaining escrowed STX back to the advertiser.
 */
export function buildCancelCampaign(campaignId: number) {
  if (campaignId < 0) throw new Error('buildCancelCampaign: campaignId must be non-negative');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'cancel-campaign',
    functionArgs: [toUIntCV(campaignId)],
    postConditionMode: PC_MODE.ALLOW,
    postConditions: [],
  };
}

/**
 * Build contract call to complete an expired campaign.
 * Calls promo-manager.complete-expired-campaign. This is
 * permissionless so anyone can trigger cleanup of expired campaigns.
 */
export function buildCompleteExpiredCampaign(campaignId: number) {
  if (campaignId < 0) throw new Error('buildCompleteExpiredCampaign: campaignId must be non-negative');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'complete-expired-campaign',
    functionArgs: [toUIntCV(campaignId)],
    postConditionMode: PC_MODE.ALLOW,
    postConditions: [],
  };
}

/**
 * Build contract call for extending campaign duration.
 * Calls promo-manager.extend-campaign-duration. Only the advertiser can extend.
 */
export function buildExtendCampaignDuration(campaignId: number, additionalBlocks: number) {
  if (campaignId < 0) throw new Error('buildExtendCampaignDuration: campaignId must be non-negative');
  if (additionalBlocks <= 0) throw new Error('buildExtendCampaignDuration: additionalBlocks must be positive');
  if (additionalBlocks > 12960) throw new Error('buildExtendCampaignDuration: additionalBlocks exceeds MAX_DURATION_BLOCKS');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'extend-campaign-duration',
    functionArgs: [toUIntCV(campaignId), toUIntCV(additionalBlocks)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call for increasing campaign budget.
 * Requires additional STX deposit from advertiser to CONTRACT_OWNER.
 */
export function buildIncreaseCampaignBudget(
  senderAddress: string,
  campaignId: number,
  additionalBudgetSTX: number,
) {
  if (!senderAddress) throw new Error('buildIncreaseCampaignBudget: senderAddress is required');
  if (campaignId < 0) throw new Error('buildIncreaseCampaignBudget: campaignId must be non-negative');
  if (additionalBudgetSTX <= 0) throw new Error('buildIncreaseCampaignBudget: additionalBudgetSTX must be positive');

  const additionalMicro = stxToMicroStx(additionalBudgetSTX);

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'increase-campaign-budget',
    functionArgs: [toUIntCV(campaignId), toUIntCV(additionalMicro)],
    postConditionMode: PC_MODE.DENY,
    postConditions: createCampaignFundingPostConditions(senderAddress, additionalBudgetSTX),
  };
}

/**
 * Build contract call for updating campaign daily budget.
 * Only the advertiser can update the daily spend limit.
 */
export function buildUpdateDailyBudget(campaignId: number, newDailyBudgetSTX: number) {
  if (campaignId < 0) throw new Error('buildUpdateDailyBudget: campaignId must be non-negative');
  if (newDailyBudgetSTX <= 0) throw new Error('buildUpdateDailyBudget: newDailyBudgetSTX must be positive');

  const dailyMicro = stxToMicroStx(newDailyBudgetSTX);

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'update-daily-budget',
    functionArgs: [toUIntCV(campaignId), toUIntCV(dailyMicro)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build read-only call for remaining campaign budget.
 * Calls promo-manager.get-remaining-budget.
 */
export function buildReadRemainingBudget(campaignId: number) {
  return {
    contractId: getContractId(CONTRACTS.PROMO_MANAGER),
    functionName: 'get-remaining-budget',
    functionArgs: [toUIntCV(campaignId)],
  };
}

/**
 * Build contract call for claiming publisher payout.
 * Calls cash-distributor.claim-payout with campaign ID.
 */
export function buildClaimPayout(
  campaignId: number,
  maxPayoutSTX: number,
) {
  if (campaignId < 0) throw new Error('buildClaimPayout: campaignId must be non-negative');
  if (maxPayoutSTX <= 0) throw new Error('buildClaimPayout: maxPayoutSTX must be positive');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.CASH_DISTRIBUTOR,
    functionName: 'claim-payout',
    functionArgs: [toUIntCV(campaignId)],
    postConditionMode: PC_MODE.DENY,
    postConditions: createPublisherPayoutPostConditions(
      CONTRACTS.FUNDS_KEEPER,
      maxPayoutSTX,
    ),
  };
}

/**
 * Build contract call for submitting an ad view (by publisher).
 * Calls stats-tracker.submit-view with campaign ID and viewer.
 */
export function buildSubmitView(
  campaignId: number,
  viewerAddress: string,
) {
  if (campaignId < 0) throw new Error('buildSubmitView: campaignId must be non-negative');
  if (!viewerAddress) throw new Error('buildSubmitView: viewerAddress is required');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.STATS_TRACKER,
    functionName: 'submit-view',
    functionArgs: [
      toUIntCV(campaignId),
      toPrincipalCV(viewerAddress),
    ],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call for creating a governance proposal.
 * Calls vote-handler.create-proposal with title, description, duration.
 */
export function buildCreateProposal(params: CreateProposalParams) {
  if (!params.title || params.title.length === 0) throw new Error('buildCreateProposal: title is required');
  if (params.title.length > 64) throw new Error('buildCreateProposal: title exceeds max length (64)');
  if (!params.description || params.description.length === 0) throw new Error('buildCreateProposal: description is required');
  if (params.description.length > 256) throw new Error('buildCreateProposal: description exceeds max length (256)');
  if (params.duration <= 0) throw new Error('buildCreateProposal: duration must be positive');

  const durationBlocks = Math.ceil(
    params.duration / BLOCK_TIME.SECONDS_PER_BLOCK,
  );

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.VOTE_HANDLER,
    functionName: 'create-proposal',
    functionArgs: [
      toStringAsciiCV(params.title),
      toStringAsciiCV(params.description),
      toUIntCV(durationBlocks),
    ],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call for casting a governance vote.
 */
export function buildCastVote(proposalId: number, inFavor: boolean) {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.VOTE_HANDLER,
    functionName: 'cast-vote',
    functionArgs: [
      toUIntCV(proposalId),
      toBoolCV(inFavor),
    ],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call for finalizing an expired proposal.
 * Permissionless: anyone can trigger finalization after voting ends.
 */
export function buildFinalizeProposal(proposalId: number) {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.VOTE_HANDLER,
    functionName: 'finalize-proposal',
    functionArgs: [toUIntCV(proposalId)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call for executing a passed proposal (admin only).
 */
export function buildExecuteProposal(proposalId: number) {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.VOTE_HANDLER,
    functionName: 'execute-proposal',
    functionArgs: [toUIntCV(proposalId)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call for cancelling an active proposal.
 * Can be called by the proposer or contract admin.
 */
export function buildCancelProposal(proposalId: number) {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.VOTE_HANDLER,
    functionName: 'cancel-proposal',
    functionArgs: [toUIntCV(proposalId)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build read-only call for vote tally on a proposal.
 */
export function buildReadVoteTally(proposalId: number) {
  return {
    contractId: getContractId(CONTRACTS.VOTE_HANDLER),
    functionName: 'get-vote-tally',
    functionArgs: [toUIntCV(proposalId)],
  };
}

/**
 * Build read-only call to get a specific vote record.
 */
export function buildReadVote(proposalId: number, voterAddress: string) {
  return {
    contractId: getContractId(CONTRACTS.VOTE_HANDLER),
    functionName: 'get-vote',
    functionArgs: [toUIntCV(proposalId), toPrincipalCV(voterAddress)],
  };
}

/**
 * Build read-only call arguments for fetching a campaign.
 * Calls promo-manager.get-campaign.
 */
export function buildReadCampaign(campaignId: number) {
  return {
    contractId: getContractId(CONTRACTS.PROMO_MANAGER),
    functionName: 'get-campaign',
    functionArgs: [toUIntCV(campaignId)],
  };
}

/**
 * Build read-only call for checking if a campaign is currently active.
 * Calls promo-manager.is-campaign-active (considers both status and block height).
 */
export function buildReadIsCampaignActive(campaignId: number) {
  return {
    contractId: getContractId(CONTRACTS.PROMO_MANAGER),
    functionName: 'is-campaign-active',
    functionArgs: [toUIntCV(campaignId)],
  };
}

/**
 * Build read-only call to check if a campaign has expired.
 */
export function buildReadIsCampaignExpired(campaignId: number) {
  return {
    contractId: getContractId(CONTRACTS.PROMO_MANAGER),
    functionName: 'is-campaign-expired',
    functionArgs: [toUIntCV(campaignId)],
  };
}

/**
 * Build read-only call to get remaining blocks until campaign expires.
 */
export function buildReadCampaignTimeRemaining(campaignId: number) {
  return {
    contractId: getContractId(CONTRACTS.PROMO_MANAGER),
    functionName: 'get-campaign-time-remaining',
    functionArgs: [toUIntCV(campaignId)],
  };
}

/**
 * Build read-only call to get daily budget remaining for current period.
 */
export function buildReadDailyBudgetRemaining(campaignId: number) {
  return {
    contractId: getContractId(CONTRACTS.PROMO_MANAGER),
    functionName: 'get-daily-budget-remaining',
    functionArgs: [toUIntCV(campaignId)],
  };
}

/**
 * Build read-only call to get platform-wide stats summary.
 */
export function buildReadPlatformStats() {
  return {
    contractId: getContractId(CONTRACTS.PROMO_MANAGER),
    functionName: 'get-platform-stats',
    functionArgs: [],
  };
}

/**
 * Build read-only call to get campaign budget utilization (0-100%).
 */
export function buildReadCampaignUtilization(campaignId: number) {
  return {
    contractId: getContractId(CONTRACTS.PROMO_MANAGER),
    functionName: 'get-campaign-utilization',
    functionArgs: [toUIntCV(campaignId)],
  };
}

/**
 * Build read-only call to check if spending is allowed for a campaign.
 */
export function buildReadCanRecordSpend(campaignId: number, amount: number) {
  return {
    contractId: getContractId(CONTRACTS.PROMO_MANAGER),
    functionName: 'can-record-spend',
    functionArgs: [toUIntCV(campaignId), toUIntCV(amount)],
  };
}

/**
 * Build read-only call to get the next available campaign ID.
 */
export function buildReadCampaignNonce() {
  return {
    contractId: getContractId(CONTRACTS.PROMO_MANAGER),
    functionName: 'get-campaign-nonce',
    functionArgs: [],
  };
}

/**
 * Build read-only call arguments for fetching analytics.
 */
export function buildReadAnalytics(campaignId: number) {
  return {
    contractId: getContractId(CONTRACTS.STATS_TRACKER),
    functionName: 'get-analytics',
    functionArgs: [toUIntCV(campaignId)],
  };
}

/**
 * Build read-only call arguments for fetching a user profile.
 */
export function buildReadUserProfile(address: string) {
  return {
    contractId: getContractId(CONTRACTS.USER_PROFILES),
    functionName: 'get-profile',
    functionArgs: [toPrincipalCV(address)],
  };
}

/**
 * Build read-only call to check if a user is registered.
 */
export function buildReadIsRegistered(address: string) {
  return {
    contractId: getContractId(CONTRACTS.USER_PROFILES),
    functionName: 'is-registered',
    functionArgs: [toPrincipalCV(address)],
  };
}

/**
 * Build read-only call to check if a user is verified.
 * Considers both verification status and expiry block height.
 */
export function buildReadIsVerified(address: string) {
  return {
    contractId: getContractId(CONTRACTS.USER_PROFILES),
    functionName: 'is-verified',
    functionArgs: [toPrincipalCV(address)],
  };
}

/**
 * Build read-only call to get user reputation score.
 */
export function buildReadReputation(address: string) {
  return {
    contractId: getContractId(CONTRACTS.USER_PROFILES),
    functionName: 'get-reputation',
    functionArgs: [toPrincipalCV(address)],
  };
}

/**
 * Build read-only call to get platform user counts.
 */
export function buildReadUserCounts() {
  return {
    contractId: getContractId(CONTRACTS.USER_PROFILES),
    functionName: 'get-user-counts',
    functionArgs: [],
  };
}

/**
 * Build contract call for updating display name.
 */
export function buildUpdateDisplayName(newName: string) {
  if (!newName || newName.length === 0) throw new Error('buildUpdateDisplayName: newName is required');
  if (newName.length > 48) throw new Error('buildUpdateDisplayName: newName exceeds max length (48)');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.USER_PROFILES,
    functionName: 'update-display-name',
    functionArgs: [toStringAsciiCV(newName)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build admin contract call to pause/unpause the user-profiles contract.
 * @param paused - Whether to pause (true) or unpause (false) the contract
 */
export function buildSetUserProfilesPaused(paused: boolean) {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.USER_PROFILES,
    functionName: 'set-contract-paused',
    functionArgs: [toBoolCV(paused)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build admin contract call to batch update reputation for multiple users.
 * @param updates - Array of {address, score} tuples (max 10)
 */
export function buildBatchUpdateReputation(updates: Array<{ address: string; score: number }>) {
  if (updates.length === 0) throw new Error('buildBatchUpdateReputation: updates array is empty');
  if (updates.length > 10) throw new Error('buildBatchUpdateReputation: max 10 updates per batch');

  for (const u of updates) {
    if (!u.address) throw new Error('buildBatchUpdateReputation: each entry must have an address');
    if (u.score < 0 || u.score > 100) throw new Error('buildBatchUpdateReputation: score must be 0-100');
  }

  // Build Clarity list of tuples
  const listItems = updates.map((u) => ({
    user: toPrincipalCV(u.address),
    score: toUIntCV(u.score),
  }));

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.USER_PROFILES,
    functionName: 'batch-update-reputation',
    functionArgs: [listItems],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call for requesting verification.
 */
export function buildRequestVerification() {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.USER_PROFILES,
    functionName: 'request-verification',
    functionArgs: [],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build read-only call to get viewer record for a campaign.
 * Returns view count, first/last view blocks for a specific viewer.
 */
export function buildReadViewerRecord(campaignId: number, viewerAddress: string) {
  return {
    contractId: getContractId(CONTRACTS.STATS_TRACKER),
    functionName: 'get-viewer-record',
    functionArgs: [toUIntCV(campaignId), toPrincipalCV(viewerAddress)],
  };
}

/**
 * Build read-only call to get publisher stats for a campaign.
 */
export function buildReadPublisherStats(campaignId: number, publisherAddress: string) {
  return {
    contractId: getContractId(CONTRACTS.STATS_TRACKER),
    functionName: 'get-publisher-stats',
    functionArgs: [toUIntCV(campaignId), toPrincipalCV(publisherAddress)],
  };
}

/**
 * Build read-only call to check if a viewer has seen a campaign.
 */
export function buildReadHasViewed(campaignId: number, viewerAddress: string) {
  return {
    contractId: getContractId(CONTRACTS.STATS_TRACKER),
    functionName: 'has-viewed',
    functionArgs: [toUIntCV(campaignId), toPrincipalCV(viewerAddress)],
  };
}

/**
 * Build read-only call to get global total views count.
 */
export function buildReadTotalViews() {
  return {
    contractId: getContractId(CONTRACTS.STATS_TRACKER),
    functionName: 'get-total-views',
    functionArgs: [],
  };
}

/**
 * Build contract call to record campaign spend in analytics.
 * Admin only - called to sync spend data from promo-manager.
 */
export function buildRecordCampaignSpend(campaignId: number, amount: number) {
  if (campaignId < 0) throw new Error('buildRecordCampaignSpend: campaignId must be non-negative');
  if (amount <= 0) throw new Error('buildRecordCampaignSpend: amount must be positive');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.STATS_TRACKER,
    functionName: 'record-campaign-spend',
    functionArgs: [toUIntCV(campaignId), toUIntCV(amount)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call to invalidate a fraudulent view.
 * Admin only - decrements valid view counts for anti-fraud.
 */
export function buildInvalidateView(campaignId: number, viewerAddress: string, publisherAddress: string) {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.STATS_TRACKER,
    functionName: 'invalidate-view',
    functionArgs: [toUIntCV(campaignId), toPrincipalCV(viewerAddress), toPrincipalCV(publisherAddress)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

// --- Funds-keeper builders ---

/**
 * Build read-only call to get escrow details for a campaign.
 */
export function buildReadEscrow(campaignId: number) {
  return {
    contractId: getContractId(CONTRACTS.FUNDS_KEEPER),
    functionName: 'get-escrow',
    functionArgs: [toUIntCV(campaignId)],
  };
}

/**
 * Build read-only call to get available escrow balance.
 */
export function buildReadEscrowBalance(campaignId: number) {
  return {
    contractId: getContractId(CONTRACTS.FUNDS_KEEPER),
    functionName: 'get-escrow-balance',
    functionArgs: [toUIntCV(campaignId)],
  };
}

/**
 * Build read-only call to get publisher release record.
 */
export function buildReadPublisherRelease(campaignId: number, publisherAddress: string) {
  return {
    contractId: getContractId(CONTRACTS.FUNDS_KEEPER),
    functionName: 'get-publisher-release',
    functionArgs: [toUIntCV(campaignId), toPrincipalCV(publisherAddress)],
  };
}

/**
 * Build read-only call to get platform-wide fund stats.
 */
export function buildReadPlatformFundStats() {
  return {
    contractId: getContractId(CONTRACTS.FUNDS_KEEPER),
    functionName: 'get-platform-stats',
    functionArgs: [],
  };
}

// --- Cash-distributor builders ---

/**
 * Build read-only call to get publisher earnings for a campaign.
 */
export function buildReadPublisherEarnings(campaignId: number, publisherAddress: string) {
  return {
    contractId: getContractId(CONTRACTS.CASH_DISTRIBUTOR),
    functionName: 'get-publisher-earnings',
    functionArgs: [toUIntCV(campaignId), toPrincipalCV(publisherAddress)],
  };
}

/**
 * Build read-only call to get claimable payout amount.
 */
export function buildReadClaimableAmount(campaignId: number, publisherAddress: string) {
  return {
    contractId: getContractId(CONTRACTS.CASH_DISTRIBUTOR),
    functionName: 'get-claimable-amount',
    functionArgs: [toUIntCV(campaignId), toPrincipalCV(publisherAddress)],
  };
}

/**
 * Build read-only call to get publisher totals across all campaigns.
 */
export function buildReadPublisherTotals(publisherAddress: string) {
  return {
    contractId: getContractId(CONTRACTS.CASH_DISTRIBUTOR),
    functionName: 'get-publisher-totals',
    functionArgs: [toPrincipalCV(publisherAddress)],
  };
}

/**
 * Build read-only call to get distribution stats.
 */
export function buildReadDistributionStats() {
  return {
    contractId: getContractId(CONTRACTS.CASH_DISTRIBUTOR),
    functionName: 'get-distribution-stats',
    functionArgs: [],
  };
}

/**
 * Build read-only call to get payout history for a publisher.
 * @param publisherAddress - The publisher's Stacks address
 */
export function buildReadPayoutHistory(publisherAddress: string) {
  if (!publisherAddress) throw new Error('buildReadPayoutHistory: publisherAddress is required');
  return {
    contractId: getContractId(CONTRACTS.CASH_DISTRIBUTOR),
    functionName: 'get-payout-history',
    functionArgs: [toPrincipalCV(publisherAddress)],
  };
}

/**
 * Build read-only call to get platform revenue summary.
 * Returns total fees, distributions, payout count, publisher count, and fee config.
 */
export function buildReadPlatformRevenue() {
  return {
    contractId: getContractId(CONTRACTS.CASH_DISTRIBUTOR),
    functionName: 'get-platform-revenue',
    functionArgs: [],
  };
}

/**
 * Build contract call to record publisher earnings (admin only).
 */
export function buildRecordEarnings(
  campaignId: number,
  publisherAddress: string,
  amount: number,
) {
  if (campaignId <= 0) throw new Error('buildRecordEarnings: campaignId must be positive');
  if (!Number.isInteger(campaignId)) throw new Error('buildRecordEarnings: campaignId must be an integer');
  if (!publisherAddress) throw new Error('buildRecordEarnings: publisherAddress is required');
  if (amount <= 0) throw new Error('buildRecordEarnings: amount must be positive');
  if (!Number.isFinite(amount)) throw new Error('buildRecordEarnings: amount must be finite');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.CASH_DISTRIBUTOR,
    functionName: 'record-earnings',
    functionArgs: [
      toUIntCV(campaignId),
      toPrincipalCV(publisherAddress),
      toUIntCV(amount),
    ],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call for updating the platform fee rate (admin only).
 * @param newRateBps - New fee rate in basis points (0-100, representing 0-10%)
 * @throws {Error} If newRateBps is outside valid bounds
 */
export function buildUpdateFeeRate(newRateBps: number) {
  if (!Number.isInteger(newRateBps)) throw new Error('buildUpdateFeeRate: newRateBps must be an integer');
  if (newRateBps < 0) throw new Error('buildUpdateFeeRate: newRateBps must be non-negative');
  if (newRateBps > 100) throw new Error('buildUpdateFeeRate: newRateBps must be <= 100 (10%)');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.CASH_DISTRIBUTOR,
    functionName: 'update-fee-rate',
    functionArgs: [toUIntCV(newRateBps)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call for batch recording publisher earnings (admin only).
 * Records earnings for two publishers in a single transaction.
 * @param campaignId - The campaign ID (must be > 0)
 * @param entries - Array of exactly 2 entries with publisherAddress and amount
 * @throws {Error} If campaignId is invalid or entries array is malformed
 */
export function buildBatchRecordEarnings(
  campaignId: number,
  entries: Array<{ publisherAddress: string; amount: number }>,
) {
  if (campaignId <= 0) throw new Error('buildBatchRecordEarnings: campaignId must be positive');
  if (!Number.isInteger(campaignId)) throw new Error('buildBatchRecordEarnings: campaignId must be an integer');
  if (!Array.isArray(entries)) throw new Error('buildBatchRecordEarnings: entries must be an array');
  if (entries.length !== 2) throw new Error('buildBatchRecordEarnings: entries must have exactly 2 elements');
  for (const entry of entries) {
    if (!entry.publisherAddress) throw new Error('buildBatchRecordEarnings: publisherAddress is required');
    if (entry.amount <= 0) throw new Error('buildBatchRecordEarnings: amount must be positive');
    if (!Number.isFinite(entry.amount)) throw new Error('buildBatchRecordEarnings: amount must be finite');
  }

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.CASH_DISTRIBUTOR,
    functionName: 'batch-record-earnings',
    functionArgs: [
      toUIntCV(campaignId),
      toPrincipalCV(entries[0].publisherAddress),
      toUIntCV(entries[0].amount),
      toPrincipalCV(entries[1].publisherAddress),
      toUIntCV(entries[1].amount),
    ],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

// --- Threat-detector builders ---

/**
 * Build read-only call to get campaign fraud score.
 */
export function buildReadCampaignScore(campaignId: number) {
  return {
    contractId: getContractId(CONTRACTS.THREAT_DETECTOR),
    functionName: 'get-campaign-score',
    functionArgs: [toUIntCV(campaignId)],
  };
}

/**
 * Build read-only call to get threat level for a campaign.
 */
export function buildReadThreatLevel(campaignId: number) {
  return {
    contractId: getContractId(CONTRACTS.THREAT_DETECTOR),
    functionName: 'get-threat-level',
    functionArgs: [toUIntCV(campaignId)],
  };
}

/**
 * Build read-only call to get account threat status.
 */
export function buildReadAccountThreats(address: string) {
  return {
    contractId: getContractId(CONTRACTS.THREAT_DETECTOR),
    functionName: 'get-account-threats',
    functionArgs: [toPrincipalCV(address)],
  };
}

/**
 * Build read-only call to check if an account is blocked.
 */
export function buildReadIsAccountBlocked(address: string) {
  return {
    contractId: getContractId(CONTRACTS.THREAT_DETECTOR),
    functionName: 'is-account-blocked',
    functionArgs: [toPrincipalCV(address)],
  };
}

// --- Audience-selector builders ---

/**
 * Build contract call to create an audience segment for a campaign.
 */
export function buildCreateSegment(
  campaignId: number,
  name: string,
  minReputation: number,
  requireVerified: boolean,
) {
  if (campaignId < 0) throw new Error('buildCreateSegment: campaignId must be non-negative');
  if (!name || name.length === 0) throw new Error('buildCreateSegment: name is required');
  if (name.length > 64) throw new Error('buildCreateSegment: name exceeds max length (64)');
  if (minReputation < 0 || minReputation > 100) throw new Error('buildCreateSegment: minReputation must be 0-100');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.AUDIENCE_SELECTOR,
    functionName: 'create-segment',
    functionArgs: [
      toUIntCV(campaignId),
      toStringAsciiCV(name),
      toUIntCV(minReputation),
      toBoolCV(requireVerified),
    ],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call to add a tag to an audience segment.
 */
export function buildAddSegmentTag(segmentId: number, tag: string) {
  if (segmentId < 0) throw new Error('buildAddSegmentTag: segmentId must be non-negative');
  if (!tag || tag.length === 0) throw new Error('buildAddSegmentTag: tag is required');
  if (tag.length > 32) throw new Error('buildAddSegmentTag: tag exceeds max length (32)');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.AUDIENCE_SELECTOR,
    functionName: 'add-segment-tag',
    functionArgs: [toUIntCV(segmentId), toStringAsciiCV(tag)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call to deactivate an audience segment.
 */
export function buildDeactivateSegment(segmentId: number) {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.AUDIENCE_SELECTOR,
    functionName: 'deactivate-segment',
    functionArgs: [toUIntCV(segmentId)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call to set/update publisher audience profile.
 */
export function buildSetPublisherProfile(
  category: string,
  region: string,
  language: string,
  audienceSize: number,
) {
  if (!category || category.length === 0) throw new Error('buildSetPublisherProfile: category is required');
  if (!region || region.length === 0) throw new Error('buildSetPublisherProfile: region is required');
  if (!language || language.length === 0) throw new Error('buildSetPublisherProfile: language is required');
  if (audienceSize <= 0) throw new Error('buildSetPublisherProfile: audienceSize must be positive');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.AUDIENCE_SELECTOR,
    functionName: 'set-publisher-profile',
    functionArgs: [
      toStringAsciiCV(category),
      toStringAsciiCV(region),
      toStringAsciiCV(language),
      toUIntCV(audienceSize),
    ],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call to add a tag to the publisher's profile.
 */
export function buildAddPublisherTag(tag: string) {
  if (!tag || tag.length === 0) throw new Error('buildAddPublisherTag: tag is required');
  if (tag.length > 32) throw new Error('buildAddPublisherTag: tag exceeds max length (32)');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.AUDIENCE_SELECTOR,
    functionName: 'add-publisher-tag',
    functionArgs: [toStringAsciiCV(tag)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build read-only call to get an audience segment.
 */
export function buildReadSegment(segmentId: number) {
  return {
    contractId: getContractId(CONTRACTS.AUDIENCE_SELECTOR),
    functionName: 'get-segment',
    functionArgs: [toUIntCV(segmentId)],
  };
}

/**
 * Build read-only call to get publisher audience profile.
 */
export function buildReadPublisherProfile(publisherAddress: string) {
  return {
    contractId: getContractId(CONTRACTS.AUDIENCE_SELECTOR),
    functionName: 'get-publisher-profile',
    functionArgs: [toPrincipalCV(publisherAddress)],
  };
}

/**
 * Build read-only call to get match score between segment and publisher.
 */
export function buildReadMatchScore(segmentId: number, publisherAddress: string) {
  return {
    contractId: getContractId(CONTRACTS.AUDIENCE_SELECTOR),
    functionName: 'get-match-score',
    functionArgs: [toUIntCV(segmentId), toPrincipalCV(publisherAddress)],
  };
}

/**
 * Build read-only call to get the number of segments for a campaign.
 */
export function buildReadCampaignSegmentCount(campaignId: number) {
  return {
    contractId: getContractId(CONTRACTS.AUDIENCE_SELECTOR),
    functionName: 'get-campaign-segment-count',
    functionArgs: [toUIntCV(campaignId)],
  };
}

// --- Partner-hub builders ---

/**
 * Build contract call to propose a partnership with a publisher.
 */
export function buildProposePartnership(
  publisherAddress: string,
  commissionRate: number,
  message: string,
) {
  if (!publisherAddress) throw new Error('buildProposePartnership: publisherAddress is required');
  if (commissionRate < 100 || commissionRate > 5000) throw new Error('buildProposePartnership: commissionRate must be between 100-5000 bps');
  if (!message || message.length === 0) throw new Error('buildProposePartnership: message is required');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PARTNER_HUB,
    functionName: 'propose-partnership',
    functionArgs: [
      toPrincipalCV(publisherAddress),
      toUIntCV(commissionRate),
      toStringAsciiCV(message),
    ],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call for a publisher to accept a partnership.
 */
export function buildAcceptPartnership(partnershipId: number) {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PARTNER_HUB,
    functionName: 'accept-partnership',
    functionArgs: [toUIntCV(partnershipId)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call to pause a partnership.
 */
export function buildPausePartnership(partnershipId: number) {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PARTNER_HUB,
    functionName: 'pause-partnership',
    functionArgs: [toUIntCV(partnershipId)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call to resume a paused partnership.
 */
export function buildResumePartnership(partnershipId: number) {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PARTNER_HUB,
    functionName: 'resume-partnership',
    functionArgs: [toUIntCV(partnershipId)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call to terminate a partnership.
 */
export function buildTerminatePartnership(partnershipId: number) {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PARTNER_HUB,
    functionName: 'terminate-partnership',
    functionArgs: [toUIntCV(partnershipId)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build contract call to enroll a campaign into a partnership.
 */
export function buildEnrollCampaign(partnershipId: number, campaignId: number) {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PARTNER_HUB,
    functionName: 'enroll-campaign',
    functionArgs: [toUIntCV(partnershipId), toUIntCV(campaignId)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build read-only call to get partnership details.
 */
export function buildReadPartnership(partnershipId: number) {
  return {
    contractId: getContractId(CONTRACTS.PARTNER_HUB),
    functionName: 'get-partnership',
    functionArgs: [toUIntCV(partnershipId)],
  };
}

/**
 * Build read-only call to look up partnership by advertiser and publisher.
 */
export function buildReadPartnershipByParties(advertiser: string, publisher: string) {
  return {
    contractId: getContractId(CONTRACTS.PARTNER_HUB),
    functionName: 'get-partnership-by-parties',
    functionArgs: [toPrincipalCV(advertiser), toPrincipalCV(publisher)],
  };
}

/**
 * Build read-only call to check if a partnership is active.
 */
export function buildReadIsPartnershipActive(partnershipId: number) {
  return {
    contractId: getContractId(CONTRACTS.PARTNER_HUB),
    functionName: 'is-partnership-active',
    functionArgs: [toUIntCV(partnershipId)],
  };
}

/**
 * Build read-only call to get total active partnerships.
 */
export function buildReadTotalActivePartnerships() {
  return {
    contractId: getContractId(CONTRACTS.PARTNER_HUB),
    functionName: 'get-total-active-partnerships',
    functionArgs: [],
  };
}

// ---------------------------------------------------------------------------
// Clarity 4 Admin Functions
// These functions are restricted to CONTRACT_OWNER (admin wallet).
// ---------------------------------------------------------------------------

/**
 * Build contract call to initialize promo-manager deploy timestamp.
 * Clarity 4: captures stacks-block-time at deployment.
 * Must be called once immediately after contract deployment.
 */
export function buildInitPromoManager() {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'init',
    functionArgs: [],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}

/**
 * Build admin contract call to refund remaining campaign budget to advertiser.
 * Clarity 4: CONTRACT_OWNER issues the actual STX refund from admin wallet
 * after campaign has been cancelled or completed.
 */
export function buildRefundCampaignBudget(campaignId: number) {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.PROMO_MANAGER,
    functionName: 'refund-campaign-budget',
    functionArgs: [toUIntCV(campaignId)],
    postConditionMode: PC_MODE.ALLOW,
    postConditions: [],
  };
}

/**
 * Build admin contract call to refund remaining escrow to advertiser.
 * Clarity 4: calls funds-keeper.refund-advertiser, which transfers
 * remaining escrowed STX from CONTRACT_OWNER to the advertiser.
 */
export function buildRefundEscrow(campaignId: number) {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.FUNDS_KEEPER,
    functionName: 'refund-advertiser',
    functionArgs: [toUIntCV(campaignId)],
    postConditionMode: PC_MODE.ALLOW,
    postConditions: [],
  };
}

/**
 * Build admin contract call to release escrow funds to a publisher.
 * Clarity 4: CONTRACT_OWNER issues the STX transfer from admin wallet.
 */
export function buildReleaseToPublisher(
  campaignId: number,
  publisherAddress: string,
  amount: number,
) {
  if (campaignId < 0) throw new Error('buildReleaseToPublisher: campaignId must be non-negative');
  if (!publisherAddress) throw new Error('buildReleaseToPublisher: publisherAddress is required');
  if (amount <= 0) throw new Error('buildReleaseToPublisher: amount must be positive');

  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.FUNDS_KEEPER,
    functionName: 'release-to-publisher',
    functionArgs: [
      toUIntCV(campaignId),
      toPrincipalCV(publisherAddress),
      toUIntCV(amount),
    ],
    postConditionMode: PC_MODE.ALLOW,
    postConditions: [],
  };
}

/**
 * Build read-only call to get deployed contract version.
 * Returns CONTRACT_VERSION string (e.g. "4.0.0").
 */
export function buildReadContractVersion(contractName: string) {
  return {
    contractId: getContractId(contractName as any),
    functionName: 'get-contract-version',
    functionArgs: [],
  };
}

/**
 * Build read-only call to get deploy timestamp from promo-manager.
 * Returns the stacks-block-time captured in init().
 */
export function buildReadDeployTime() {
  return {
    contractId: getContractId(CONTRACTS.PROMO_MANAGER),
    functionName: 'get-deploy-time',
    functionArgs: [],
  };
}
