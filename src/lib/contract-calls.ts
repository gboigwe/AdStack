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
  const roleUint = ROLE_TO_UINT[params.role];
  if (roleUint === undefined) {
    throw new Error(`Invalid role: ${params.role}`);
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
export function buildInvalidateView(campaignId: number, viewerAddress: string) {
  return {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACTS.STATS_TRACKER,
    functionName: 'invalidate-view',
    functionArgs: [toUIntCV(campaignId), toPrincipalCV(viewerAddress)],
    postConditionMode: PC_MODE.DENY,
    postConditions: [],
  };
}
