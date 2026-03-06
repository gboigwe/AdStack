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
