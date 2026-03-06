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
