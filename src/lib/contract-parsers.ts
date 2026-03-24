/**
 * Contract Response Parsers
 * Convert raw Clarity read-only responses into typed frontend objects.
 * Each parser handles the kebab-case to camelCase mapping and bigint
 * to number conversion for fields that fit safely in JS numbers.
 */

import { UserRole, VerificationStatus, ProposalStatus } from '@/types/contracts';
import type {
  UserProfile,
  RawClarityProfile,
  RawClarityUserCounts,
  UserCounts,
  AnalyticsMetrics,
  RawClarityAnalytics,
  PublisherMetrics,
  RawClarityPublisherStats,
  ViewerRecord,
  RawClarityViewerRecord,
  GovernanceProposal,
  RawClarityProposal,
  VoteTally,
} from '@/types/contracts';

// --- Role mapping ---

const ROLE_MAP: Record<number, UserRole> = {
  1: UserRole.ADVERTISER,
  2: UserRole.PUBLISHER,
  3: UserRole.VIEWER,
};

const STATUS_MAP: Record<number, UserProfile['status']> = {
  1: 'active',
  2: 'inactive',
  3: 'suspended',
};

const VERIFICATION_MAP: Record<number, VerificationStatus> = {
  0: VerificationStatus.UNVERIFIED,
  1: VerificationStatus.PENDING,
  2: VerificationStatus.VERIFIED,
  3: VerificationStatus.REJECTED,
};

/**
 * Parse a raw Clarity profile response into a typed UserProfile.
 * @param address - The Stacks address that owns this profile
 * @param raw - The raw Clarity map response with kebab-case keys
 */
export function parseUserProfile(
  address: string,
  raw: RawClarityProfile,
): UserProfile {
  const roleNum = Number(raw.role);
  const statusNum = Number(raw.status);
  const verNum = Number(raw['verification-status']);

  return {
    address,
    displayName: raw['display-name'],
    role: ROLE_MAP[roleNum] ?? UserRole.VIEWER,
    status: STATUS_MAP[statusNum] ?? 'active',
    verificationStatus: VERIFICATION_MAP[verNum] ?? VerificationStatus.UNVERIFIED,
    verificationExpires: Number(raw['verification-expires']),
    reputationScore: Number(raw['reputation-score']),
    joinHeight: Number(raw['join-height']),
    lastActive: Number(raw['last-active']),
    totalCampaigns: Number(raw['total-campaigns']),
    totalEarnings: raw['total-earnings'],
  };
}

/**
 * Parse raw user counts from the contract into typed UserCounts.
 */
export function parseUserCounts(raw: RawClarityUserCounts): UserCounts {
  return {
    total: Number(raw.total),
    advertisers: Number(raw.advertisers),
    publishers: Number(raw.publishers),
    viewers: Number(raw.viewers),
  };
}

// --- Stats-tracker parsers ---

/**
 * Parse raw campaign analytics from stats-tracker contract.
 */
export function parseCampaignAnalytics(
  campaignId: number,
  raw: RawClarityAnalytics,
): AnalyticsMetrics {
  return {
    campaignId,
    totalViews: Number(raw['total-views']),
    uniqueViewers: Number(raw['unique-viewers']),
    totalSpent: raw['total-spent'],
    lastViewBlock: Number(raw['last-view-block']),
  };
}

/**
 * Parse raw publisher stats from stats-tracker contract.
 */
export function parsePublisherStats(
  campaignId: number,
  publisher: string,
  raw: RawClarityPublisherStats,
): PublisherMetrics {
  return {
    publisher,
    campaignId,
    viewsSubmitted: Number(raw['views-submitted']),
    validViews: Number(raw['valid-views']),
    lastSubmitBlock: Number(raw['last-submit-block']),
  };
}

/**
 * Parse raw viewer record from stats-tracker contract.
 */
export function parseViewerRecord(
  campaignId: number,
  viewer: string,
  raw: RawClarityViewerRecord,
): ViewerRecord {
  return {
    campaignId,
    viewer,
    viewCount: Number(raw['view-count']),
    firstViewBlock: Number(raw['first-view-block']),
    lastViewBlock: Number(raw['last-view-block']),
  };
}

// --- Vote-handler parsers ---

const PROPOSAL_STATUS_MAP: Record<number, ProposalStatus> = {
  1: ProposalStatus.ACTIVE,
  2: ProposalStatus.PASSED,
  3: ProposalStatus.REJECTED,
  4: ProposalStatus.EXECUTED,
};

/**
 * Parse raw proposal from vote-handler contract.
 */
export function parseProposal(
  proposalId: number,
  raw: RawClarityProposal,
): GovernanceProposal {
  const statusNum = Number(raw.status);

  return {
    proposalId,
    proposer: raw.proposer,
    title: raw.title,
    description: raw.description,
    votesFor: Number(raw['votes-for']),
    votesAgainst: Number(raw['votes-against']),
    totalVoters: Number(raw['total-voters']),
    startHeight: Number(raw['start-height']),
    endHeight: Number(raw['end-height']),
    status: PROPOSAL_STATUS_MAP[statusNum] ?? ProposalStatus.ACTIVE,
    createdAt: Number(raw['created-at']),
    executedAt: Number(raw['executed-at']),
  };
}

/**
 * Parse vote tally response.
 */
export function parseVoteTally(raw: {
  'votes-for': bigint;
  'votes-against': bigint;
  'total-voters': bigint;
}): VoteTally {
  return {
    votesFor: Number(raw['votes-for']),
    votesAgainst: Number(raw['votes-against']),
    totalVoters: Number(raw['total-voters']),
  };
}
