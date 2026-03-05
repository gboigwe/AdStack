/**
 * Contract TypeScript Types for AdStack
 * Type-safe contract interactions with Clarity v4
 */

/**
 * Campaign Status Enum
 */
export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * User Role Enum
 */
export enum UserRole {
  ADVERTISER = 'advertiser',
  PUBLISHER = 'publisher',
  VIEWER = 'viewer',
}

/**
 * Verification Status Enum
 */
export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

/**
 * Campaign Interface (from promo-manager contract)
 */
export interface Campaign {
  campaignId: number;
  advertiser: string;
  name: string;
  budget: bigint;
  spent: bigint;
  dailyBudget: bigint;
  startHeight: number;
  endHeight: number;
  status: CampaignStatus;
  createdAt: number; // Unix timestamp from stacks-block-time
  lastUpdated: number; // Unix timestamp from stacks-block-time
  metadata?: string;
}

/**
 * User Profile Interface (from user-profiles contract)
 */
export interface UserProfile {
  address: string;
  status: 'active' | 'inactive' | 'suspended';
  roles: UserRole[];
  joinHeight: number; // Unix timestamp from stacks-block-time
  lastActive: number; // Unix timestamp from stacks-block-time
  verificationStatus: VerificationStatus;
  verificationExpires: number; // Unix timestamp
  profilesCount: number;
  metadata?: string;
}

/**
 * Analytics Metrics Interface (from stats-tracker contract)
 */
export interface AnalyticsMetrics {
  totalViews: bigint;
  validViews: bigint;
  clicks: bigint;
  conversions: bigint;
  spent: bigint;
  revenue: bigint;
  lastUpdated: number; // Unix timestamp
}

/**
 * Publisher Metrics Interface
 */
export interface PublisherMetrics {
  publisher: string;
  campaignId: number;
  totalViews: bigint;
  totalEarned: bigint;
  avgCtr: number;
  qualityScore: number;
  lastPayout: number; // Unix timestamp
}

/**
 * Escrow Details Interface (from funds-keeper contract)
 */
export interface EscrowDetails {
  campaignId: number;
  balance: bigint;
  locked: bigint;
  released: bigint;
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'completed' | 'refunded';
}

/**
 * Auction Bid Interface (from offer-exchange contract)
 */
export interface AuctionBid {
  auctionId: number;
  bidder: string;
  amount: bigint;
  timestamp: number;
  status: 'active' | 'won' | 'lost' | 'withdrawn';
}

/**
 * Dispute Interface (from mediation-hub contract)
 */
export interface Dispute {
  disputeId: number;
  plaintiff: string;
  defendant: string;
  campaignId: number;
  reason: string;
  status: 'open' | 'in-progress' | 'resolved' | 'dismissed';
  createdAt: number;
  resolvedAt?: number;
  resolution?: string;
}

/**
 * Fraud Score Interface (from threat-detector contract)
 */
export interface FraudScore {
  campaignId: number;
  score: number; // 0-100
  flagCount: number;
  lastChecked: number;
  details: {
    suspiciousViews: bigint;
    totalViews: bigint;
    fraudPercentage: number;
  };
}

/**
 * Governance Proposal Interface (from vote-handler contract)
 */
export interface GovernanceProposal {
  proposalId: number;
  proposer: string;
  title: string;
  description: string;
  votesFor: bigint;
  votesAgainst: bigint;
  status: 'active' | 'passed' | 'rejected' | 'executed';
  createdAt: number;
  expiresAt: number;
  executedAt?: number;
}

/**
 * Subscription Plan Interface (from subscription-hub contract)
 */
export interface SubscriptionPlan {
  planId: number;
  name: string;
  price: bigint;
  duration: number; // in seconds
  features: string[];
  isActive: boolean;
}

/**
 * User Subscription Interface
 */
export interface UserSubscription {
  user: string;
  planId: number;
  startDate: number;
  endDate: number;
  isActive: boolean;
  autoRenew: boolean;
}

/**
 * Payout Record Interface (from cash-distributor contract)
 */
export interface PayoutRecord {
  payoutId: number;
  recipient: string;
  amount: bigint;
  campaignId: number;
  timestamp: number;
  txId: string;
  status: 'pending' | 'completed' | 'failed';
}

/**
 * Contract Call Result Generic
 */
export interface ContractCallResult<T = any> {
  success: boolean;
  txId?: string;
  data?: T;
  error?: string;
}

/**
 * Contract Read Result Generic
 */
export interface ContractReadResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Transaction Options for Contract Calls
 */
export interface TransactionOptions {
  fee?: bigint;
  nonce?: bigint;
  postConditions?: any[];
}

/**
 * Campaign Creation Params
 */
export interface CreateCampaignParams {
  name: string;
  budget: bigint;
  dailyBudget: bigint;
  duration: number;
  metadata?: string;
}

/**
 * User Registration Params
 */
export interface RegisterUserParams {
  role: UserRole;
  displayName: string;
  metadata?: string;
}

/**
 * Create Auction Params
 */
export interface CreateAuctionParams {
  startingBid: bigint;
  reservePrice: bigint;
  duration: number;
  metadata?: string;
}

/**
 * Submit Dispute Params
 */
export interface SubmitDisputeParams {
  defendant: string;
  campaignId: number;
  reason: string;
  evidence?: string;
}

/**
 * Create Proposal Params
 */
export interface CreateProposalParams {
  title: string;
  description: string;
  duration: number;
}

/**
 * Analytics Query Params
 */
export interface AnalyticsQueryParams {
  campaignId?: number;
  publisher?: string;
  startDate?: number;
  endDate?: number;
}

/**
 * Payout Params
 */
export interface PayoutParams {
  recipients: Array<{
    address: string;
    amount: bigint;
  }>;
  campaignId: number;
}

/**
 * Contract Event Types
 */
export interface ContractEvent {
  type: string;
  data: Record<string, any>;
  txId: string;
  blockHeight: number;
  timestamp: number;
}

/**
 * Campaign Event
 */
export interface CampaignEvent extends ContractEvent {
  type: 'campaign-created' | 'campaign-updated' | 'campaign-paused' | 'campaign-completed';
  data: {
    campaignId: number;
    advertiser: string;
  };
}

/**
 * Payout Event
 */
export interface PayoutEvent extends ContractEvent {
  type: 'payout-processed' | 'payout-failed';
  data: {
    payoutId: number;
    recipient: string;
    amount: bigint;
  };
}

/**
 * Dispute Event
 */
export interface DisputeEvent extends ContractEvent {
  type: 'dispute-created' | 'dispute-resolved';
  data: {
    disputeId: number;
    plaintiff: string;
    defendant: string;
  };
}
