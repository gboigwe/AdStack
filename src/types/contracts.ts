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
 * Proposal Status Enum
 */
export enum ProposalStatus {
  ACTIVE = 'active',
  PASSED = 'passed',
  REJECTED = 'rejected',
  EXECUTED = 'executed',
}

/**
 * Escrow Status Enum
 */
export enum EscrowStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
}

/**
 * Payout Status Enum
 */
export enum PayoutStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Dispute Status Enum
 */
export enum DisputeStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
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
 * Matches the on-chain `profiles` map structure in user-profiles.clar.
 */
export interface UserProfile {
  address: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  verificationStatus: VerificationStatus;
  verificationExpires: number; // block height
  reputationScore: number; // 0-100
  joinHeight: number; // block height at registration
  lastActive: number; // block height of last activity
  totalCampaigns: number;
  totalEarnings: bigint;
}

/**
 * On-chain profile shape returned by the Clarity read-only call.
 * Keys use kebab-case matching the Clarity map field names.
 */
export interface RawClarityProfile {
  'display-name': string;
  role: bigint;
  status: bigint;
  'verification-status': bigint;
  'verification-expires': bigint;
  'reputation-score': bigint;
  'join-height': bigint;
  'last-active': bigint;
  'total-campaigns': bigint;
  'total-earnings': bigint;
}

/**
 * On-chain user counts shape returned by get-user-counts.
 */
export interface RawClarityUserCounts {
  total: bigint;
  advertisers: bigint;
  publishers: bigint;
  viewers: bigint;
}

/**
 * Parsed user counts for frontend consumption.
 */
export interface UserCounts {
  total: number;
  advertisers: number;
  publishers: number;
  viewers: number;
}

/**
 * Analytics Metrics Interface (from stats-tracker contract)
 * Matches the campaign-analytics map in stats-tracker.clar.
 */
export interface AnalyticsMetrics {
  campaignId: number;
  totalViews: number;
  uniqueViewers: number;
  totalSpent: bigint;
  lastViewBlock: number;
}

/**
 * Raw on-chain analytics shape from stats-tracker read-only calls.
 */
export interface RawClarityAnalytics {
  'total-views': bigint;
  'unique-viewers': bigint;
  'total-spent': bigint;
  'last-view-block': bigint;
}

/**
 * Publisher stats from stats-tracker contract.
 */
export interface PublisherMetrics {
  publisher: string;
  campaignId: number;
  viewsSubmitted: number;
  validViews: number;
  lastSubmitBlock: number;
}

/**
 * Raw on-chain publisher stats shape.
 */
export interface RawClarityPublisherStats {
  'views-submitted': bigint;
  'valid-views': bigint;
  'last-submit-block': bigint;
}

/**
 * Viewer record from stats-tracker contract.
 */
export interface ViewerRecord {
  campaignId: number;
  viewer: string;
  viewCount: number;
  firstViewBlock: number;
  lastViewBlock: number;
}

/**
 * Raw on-chain viewer record shape.
 */
export interface RawClarityViewerRecord {
  'view-count': bigint;
  'first-view-block': bigint;
  'last-view-block': bigint;
}

/**
 * Escrow Details Interface (from funds-keeper contract)
 * Matches the escrows map in funds-keeper.clar.
 */
export interface EscrowDetails {
  campaignId: number;
  advertiser: string;
  deposited: bigint;
  released: bigint;
  refunded: bigint;
  status: EscrowStatus;
  createdAt: number;
  lastReleaseBlock: number;
}

/**
 * Raw on-chain escrow shape from funds-keeper read-only calls.
 */
export interface RawClarityEscrow {
  advertiser: string;
  deposited: bigint;
  released: bigint;
  refunded: bigint;
  status: bigint;
  'created-at': bigint;
  'last-release-block': bigint;
}

/**
 * Platform-wide fund statistics from funds-keeper.
 */
export interface PlatformFundStats {
  escrowed: bigint;
  released: bigint;
  refunded: bigint;
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
  status: DisputeStatus;
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
 * Matches the proposals map in vote-handler.clar.
 */
export interface GovernanceProposal {
  proposalId: number;
  proposer: string;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
  startHeight: number;
  endHeight: number;
  status: ProposalStatus;
  createdAt: number;
  executedAt: number;
}

/**
 * Raw on-chain proposal shape from vote-handler read-only calls.
 */
export interface RawClarityProposal {
  proposer: string;
  title: string;
  description: string;
  'votes-for': bigint;
  'votes-against': bigint;
  'total-voters': bigint;
  'start-height': bigint;
  'end-height': bigint;
  status: bigint;
  'created-at': bigint;
  'executed-at': bigint;
}

/**
 * Vote tally summary from vote-handler.
 */
export interface VoteTally {
  votesFor: number;
  votesAgainst: number;
  totalVoters: number;
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
  status: PayoutStatus;
}

/**
 * Contract Call Result Generic
 */
export interface ContractCallResult<T = unknown> {
  success: boolean;
  txId?: string;
  data?: T;
  error?: string;
}

/**
 * Contract Read Result Generic
 */
export interface ContractReadResult<T = unknown> {
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
  postConditions?: unknown[];
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
  data: Record<string, unknown>;
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
