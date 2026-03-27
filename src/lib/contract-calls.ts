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
  if (!senderAddress) throw new Error('buildCreateCampaign: senderAddress is required');
  if (!params.name || params.name.length === 0) throw new Error('buildCreateCampaign: name is required');
  if (Number(params.budget) <= 0) throw new Error('buildCreateCampaign: budget must be positive');
  if (Number(params.dailyBudget) <= 0) throw new Error('buildCreateCampaign: dailyBudget must be positive');
  if (Number(params.dailyBudget) > Number(params.budget)) throw new Error('buildCreateCampaign: dailyBudget cannot exceed total budget');

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
 * Build contract call to record publisher earnings (admin only).
 */
export function buildRecordEarnings(
  campaignId: number,
  publisherAddress: string,
  amount: number,
) {
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
