/**
 * Response Parser Utilities for Clarity v4
 * Parse contract responses to TypeScript objects
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

/**
 * Parse Campaign from Clarity response
 */
export function parseCampaign(cv: ClarityValue): Campaign | null {
  try {
    const value = cvToValue(cv) as any;

    if (!value || typeof value !== 'object') {
      return null;
    }

    return {
      campaignId: Number(value.campaignId || value['campaign-id']),
      advertiser: String(value.advertiser),
      name: String(value.name),
      budget: BigInt(value.budget),
      spent: BigInt(value.spent),
      dailyBudget: BigInt(value.dailyBudget || value['daily-budget']),
      startHeight: Number(value.startHeight || value['start-height']),
      endHeight: Number(value.endHeight || value['end-height']),
      status: (value.status as CampaignStatus) || CampaignStatus.DRAFT,
      createdAt: Number(value.createdAt || value['created-at']),
      lastUpdated: Number(value.lastUpdated || value['last-updated']),
      metadata: value.metadata,
    };
  } catch (error) {
    console.error('Error parsing campaign:', error);
    return null;
  }
}

/**
 * Parse User Profile from Clarity response
 */
export function parseUserProfile(cv: ClarityValue): UserProfile | null {
  try {
    const value = cvToValue(cv) as any;

    if (!value || typeof value !== 'object') {
      return null;
    }

    return {
      address: String(value.address || value.user),
      status: value.status || 'inactive',
      roles: Array.isArray(value.roles) ? value.roles as UserRole[] : [],
      joinHeight: Number(value.joinHeight || value['join-height']),
      lastActive: Number(value.lastActive || value['last-active']),
      verificationStatus:
        (value.verificationStatus || value['verification-status']) as VerificationStatus ||
        VerificationStatus.UNVERIFIED,
      verificationExpires: Number(
        value.verificationExpires || value['verification-expires']
      ),
      profilesCount: Number(value.profilesCount || value['profiles-count'] || 0),
      metadata: value.metadata,
    };
  } catch (error) {
    console.error('Error parsing user profile:', error);
    return null;
  }
}

/**
 * Parse Analytics Metrics from Clarity response
 */
export function parseAnalyticsMetrics(cv: ClarityValue): AnalyticsMetrics | null {
  try {
    const value = cvToValue(cv) as any;

    if (!value || typeof value !== 'object') {
      return null;
    }

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
 */
export function parseEscrowDetails(cv: ClarityValue): EscrowDetails | null {
  try {
    const value = cvToValue(cv) as any;

    if (!value || typeof value !== 'object') {
      return null;
    }

    return {
      campaignId: Number(value.campaignId || value['campaign-id']),
      balance: BigInt(value.balance || 0),
      locked: BigInt(value.locked || 0),
      released: BigInt(value.released || 0),
      createdAt: Number(value.createdAt || value['created-at']),
      expiresAt: Number(value.expiresAt || value['expires-at']),
      status: value.status || 'active',
    };
  } catch (error) {
    console.error('Error parsing escrow details:', error);
    return null;
  }
}

/**
 * Parse Auction Bid from Clarity response
 */
export function parseAuctionBid(cv: ClarityValue): AuctionBid | null {
  try {
    const value = cvToValue(cv) as any;

    if (!value || typeof value !== 'object') {
      return null;
    }

    return {
      auctionId: Number(value.auctionId || value['auction-id']),
      bidder: String(value.bidder),
      amount: BigInt(value.amount),
      timestamp: Number(value.timestamp),
      status: value.status || 'active',
    };
  } catch (error) {
    console.error('Error parsing auction bid:', error);
    return null;
  }
}

/**
 * Parse Dispute from Clarity response
 */
export function parseDispute(cv: ClarityValue): Dispute | null {
  try {
    const value = cvToValue(cv) as any;

    if (!value || typeof value !== 'object') {
      return null;
    }

    return {
      disputeId: Number(value.disputeId || value['dispute-id']),
      plaintiff: String(value.plaintiff),
      defendant: String(value.defendant),
      campaignId: Number(value.campaignId || value['campaign-id']),
      reason: String(value.reason),
      status: value.status || 'open',
      createdAt: Number(value.createdAt || value['created-at']),
      resolvedAt: value.resolvedAt ? Number(value.resolvedAt) : undefined,
      resolution: value.resolution,
    };
  } catch (error) {
    console.error('Error parsing dispute:', error);
    return null;
  }
}

/**
 * Parse Fraud Score from Clarity response
 */
export function parseFraudScore(cv: ClarityValue): FraudScore | null {
  try {
    const value = cvToValue(cv) as any;

    if (!value || typeof value !== 'object') {
      return null;
    }

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
 */
export function parseGovernanceProposal(cv: ClarityValue): GovernanceProposal | null {
  try {
    const value = cvToValue(cv) as any;

    if (!value || typeof value !== 'object') {
      return null;
    }

    return {
      proposalId: Number(value.proposalId || value['proposal-id']),
      proposer: String(value.proposer),
      title: String(value.title),
      description: String(value.description),
      votesFor: BigInt(value.votesFor || value['votes-for'] || 0),
      votesAgainst: BigInt(value.votesAgainst || value['votes-against'] || 0),
      status: value.status || 'active',
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
 */
export function parsePayoutRecord(cv: ClarityValue): PayoutRecord | null {
  try {
    const value = cvToValue(cv) as any;

    if (!value || typeof value !== 'object') {
      return null;
    }

    return {
      payoutId: Number(value.payoutId || value['payout-id']),
      recipient: String(value.recipient),
      amount: BigInt(value.amount),
      campaignId: Number(value.campaignId || value['campaign-id']),
      timestamp: Number(value.timestamp),
      txId: String(value.txId || value['tx-id'] || ''),
      status: value.status || 'pending',
    };
  } catch (error) {
    console.error('Error parsing payout record:', error);
    return null;
  }
}

/**
 * Parse list of items
 */
export function parseList<T>(
  cv: ClarityValue,
  parser: (item: ClarityValue) => T | null
): T[] {
  try {
    const value = cvToValue(cv);

    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => parser(item as any))
      .filter((item): item is T => item !== null);
  } catch (error) {
    console.error('Error parsing list:', error);
    return [];
  }
}

/**
 * Parse optional value
 */
export function parseOptional<T>(
  cv: ClarityValue,
  parser: (item: ClarityValue) => T | null
): T | null {
  try {
    const value = cvToValue(cv);

    if (value === null || value === undefined) {
      return null;
    }

    return parser(value as any);
  } catch (error) {
    console.error('Error parsing optional:', error);
    return null;
  }
}

/**
 * Parse response (ok/err)
 */
export function parseResponse<T>(
  cv: ClarityValue,
  parser: (item: ClarityValue) => T | null
): { success: boolean; value: T | null; error?: string } {
  try {
    const response = cvToValue(cv) as any;

    if (typeof response === 'object' && 'value' in response) {
      if (response.success !== false) {
        return {
          success: true,
          value: parser(response.value as any),
        };
      } else {
        return {
          success: false,
          value: null,
          error: String(response.value),
        };
      }
    }

    // If not a response type, try to parse directly
    return {
      success: true,
      value: parser(response as any),
    };
  } catch (error) {
    return {
      success: false,
      value: null,
      error: error instanceof Error ? error.message : 'Parse error',
    };
  }
}
