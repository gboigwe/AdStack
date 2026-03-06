/**
 * Response Parser Utilities for Clarity v4
 * Parse contract responses to TypeScript objects with full type safety
 */

import { cvToValue, ClarityValue } from '@stacks/transactions';
import {
  Campaign,
  UserProfile,
  AnalyticsMetrics,
  EscrowDetails,
  AuctionBid,
  Dispute,
  FraudScore,
  GovernanceProposal,
  PayoutRecord,
  CampaignStatus,
  UserRole,
  VerificationStatus,
} from '../types/contracts';

/** Typed record for deserialized Clarity tuple values */
type ClarityRecord = Record<string, string | number | bigint | boolean | null | undefined>;

/**
 * Parse Campaign from Clarity response
 * @param cv - The ClarityValue returned from a contract read-only call
 * @returns Parsed Campaign object or null if parsing fails
 */
export function parseCampaign(cv: ClarityValue): Campaign | null {
  try {
    const value = cvToValue(cv) as ClarityRecord;
    if (!value || typeof value !== 'object') return null;

    return {
      campaignId: Number(value.campaignId || value['campaign-id']),
      advertiser: String(value.advertiser),
      name: String(value.name),
      budget: BigInt(value.budget ?? 0),
      spent: BigInt(value.spent ?? 0),
      dailyBudget: BigInt(value.dailyBudget || value['daily-budget'] || 0),
      startHeight: Number(value.startHeight || value['start-height']),
      endHeight: Number(value.endHeight || value['end-height']),
      status: (value.status as CampaignStatus) || CampaignStatus.DRAFT,
      createdAt: Number(value.createdAt || value['created-at']),
      lastUpdated: Number(value.lastUpdated || value['last-updated']),
      metadata: value.metadata as string | undefined,
    };
  } catch (error) {
    console.error('Error parsing campaign:', error);
    return null;
  }
}

/**
 * Parse User Profile from Clarity response
 * @param cv - The ClarityValue containing user profile data
 * @returns Parsed UserProfile object or null if parsing fails
 */
export function parseUserProfile(cv: ClarityValue): UserProfile | null {
  try {
    const value = cvToValue(cv) as ClarityRecord;
    if (!value || typeof value !== 'object') return null;

    return {
      address: String(value.address || value.user),
      status: (value.status as UserProfile['status']) || 'inactive',
      roles: Array.isArray(value.roles) ? value.roles as UserRole[] : [],
      joinHeight: Number(value.joinHeight || value['join-height']),
      lastActive: Number(value.lastActive || value['last-active']),
      verificationStatus:
        (value.verificationStatus || value['verification-status']) as VerificationStatus ||
        VerificationStatus.UNVERIFIED,
      verificationExpires: Number(value.verificationExpires || value['verification-expires']),
      profilesCount: Number(value.profilesCount || value['profiles-count'] || 0),
      metadata: value.metadata as string | undefined,
    };
  } catch (error) {
    console.error('Error parsing user profile:', error);
    return null;
  }
}

/**
 * Parse Analytics Metrics from Clarity response
 * @param cv - The ClarityValue containing analytics data
 * @returns Parsed AnalyticsMetrics object or null if parsing fails
 */
export function parseAnalyticsMetrics(cv: ClarityValue): AnalyticsMetrics | null {
  try {
    const value = cvToValue(cv) as ClarityRecord;
    if (!value || typeof value !== 'object') return null;

    return {
      totalViews: BigInt(value.totalViews || value['total-views'] || 0),
      validViews: BigInt(value.validViews || value['valid-views'] || 0),
      clicks: BigInt(value.clicks || 0),
      conversions: BigInt(value.conversions || 0),
      spent: BigInt(value.spent || 0),
      revenue: BigInt(value.revenue || 0),
      lastUpdated: Number(value.lastUpdated || value['last-updated']),
    };
  } catch (error) {
    console.error('Error parsing analytics metrics:', error);
    return null;
  }
}

/**
 * Parse Escrow Details from Clarity response
 * @param cv - The ClarityValue containing escrow data
 * @returns Parsed EscrowDetails object or null if parsing fails
 */
export function parseEscrowDetails(cv: ClarityValue): EscrowDetails | null {
  try {
    const value = cvToValue(cv) as ClarityRecord;
    if (!value || typeof value !== 'object') return null;

    return {
      campaignId: Number(value.campaignId || value['campaign-id']),
      balance: BigInt(value.balance || 0),
      locked: BigInt(value.locked || 0),
      released: BigInt(value.released || 0),
      createdAt: Number(value.createdAt || value['created-at']),
      expiresAt: Number(value.expiresAt || value['expires-at']),
      status: (value.status as EscrowDetails['status']) || 'active',
    };
  } catch (error) {
    console.error('Error parsing escrow details:', error);
    return null;
  }
}

/**
 * Parse Auction Bid from Clarity response
 * @param cv - The ClarityValue containing bid data
 * @returns Parsed AuctionBid object or null if data is invalid
 */
export function parseAuctionBid(cv: ClarityValue): AuctionBid | null {
  try {
    const value = cvToValue(cv) as ClarityRecord;
    if (!value || typeof value !== 'object') return null;

    return {
      auctionId: Number(value.auctionId || value['auction-id']),
      bidder: String(value.bidder),
      amount: BigInt(value.amount ?? 0),
      timestamp: Number(value.timestamp),
      status: (value.status as AuctionBid['status']) || 'active',
    };
  } catch (error) {
    console.error('Error parsing auction bid:', error);
    return null;
  }
}

/**
 * Parse Dispute from Clarity response
 * @param cv - The ClarityValue containing dispute data
 * @returns Parsed Dispute object or null if parsing fails
 */
export function parseDispute(cv: ClarityValue): Dispute | null {
  try {
    const value = cvToValue(cv) as ClarityRecord;
    if (!value || typeof value !== 'object') return null;

    return {
      disputeId: Number(value.disputeId || value['dispute-id']),
      plaintiff: String(value.plaintiff),
      defendant: String(value.defendant),
      campaignId: Number(value.campaignId || value['campaign-id']),
      reason: String(value.reason),
      status: (value.status as Dispute['status']) || 'open',
      createdAt: Number(value.createdAt || value['created-at']),
      resolvedAt: value.resolvedAt ? Number(value.resolvedAt) : undefined,
      resolution: value.resolution as string | undefined,
    };
  } catch (error) {
    console.error('Error parsing dispute:', error);
    return null;
  }
}

/**
 * Parse Fraud Score from Clarity response
 * @param cv - The ClarityValue containing fraud scoring data
 * @returns Parsed FraudScore object with nested details or null
 */
export function parseFraudScore(cv: ClarityValue): FraudScore | null {
  try {
    const value = cvToValue(cv) as ClarityRecord;
    if (!value || typeof value !== 'object') return null;

    return {
      campaignId: Number(value.campaignId || value['campaign-id']),
      score: Number(value.score || 0),
      flagCount: Number(value.flagCount || value['flag-count'] || 0),
      lastChecked: Number(value.lastChecked || value['last-checked']),
      details: {
        suspiciousViews: BigInt(value.suspiciousViews || value['suspicious-views'] || 0),
        totalViews: BigInt(value.totalViews || value['total-views'] || 0),
        fraudPercentage: Number(value.fraudPercentage || value['fraud-percentage'] || 0),
      },
    };
  } catch (error) {
    console.error('Error parsing fraud score:', error);
    return null;
  }
}

/**
 * Parse Governance Proposal from Clarity response
 * @param cv - The ClarityValue containing proposal data
 * @returns Parsed GovernanceProposal object or null if parsing fails
 */
export function parseGovernanceProposal(cv: ClarityValue): GovernanceProposal | null {
  try {
    const value = cvToValue(cv) as ClarityRecord;
    if (!value || typeof value !== 'object') return null;

    return {
      proposalId: Number(value.proposalId || value['proposal-id']),
      proposer: String(value.proposer),
      title: String(value.title),
      description: String(value.description),
      votesFor: BigInt(value.votesFor || value['votes-for'] || 0),
      votesAgainst: BigInt(value.votesAgainst || value['votes-against'] || 0),
      status: (value.status as GovernanceProposal['status']) || 'active',
      createdAt: Number(value.createdAt || value['created-at']),
      expiresAt: Number(value.expiresAt || value['expires-at']),
      executedAt: value.executedAt ? Number(value.executedAt) : undefined,
    };
  } catch (error) {
    console.error('Error parsing governance proposal:', error);
    return null;
  }
}

/**
 * Parse Payout Record from Clarity response
 * @param cv - The ClarityValue containing payout data
 * @returns Parsed PayoutRecord object or null if data is invalid
 */
export function parsePayoutRecord(cv: ClarityValue): PayoutRecord | null {
  try {
    const value = cvToValue(cv) as ClarityRecord;
    if (!value || typeof value !== 'object') return null;

    return {
      payoutId: Number(value.payoutId || value['payout-id']),
      recipient: String(value.recipient),
      amount: BigInt(value.amount ?? 0),
      campaignId: Number(value.campaignId || value['campaign-id']),
      timestamp: Number(value.timestamp),
      txId: String(value.txId || value['tx-id'] || ''),
      status: (value.status as PayoutRecord['status']) || 'pending',
    };
  } catch (error) {
    console.error('Error parsing payout record:', error);
    return null;
  }
}
