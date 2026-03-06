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
