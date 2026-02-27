export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'expired' | 'grace_period';
export type BillingInterval = 'monthly' | 'quarterly' | 'yearly';
export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'refunded' | 'canceled';
export type PaymentMethodType = 'stx' | 'escrow' | 'auto_debit';
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
export type UsageType = 'campaigns' | 'impressions' | 'clicks' | 'conversions' | 'api_calls' | 'team_members' | 'storage' | 'reports';
export type CampaignStatus = 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'canceled';

export interface Subscription {
  id: string;
  userId: string;
  subscriptionId: number;
  planId: number;
  planName: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  price: number;
  billingInterval: BillingInterval;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  cancellationFeedback: string | null;
  gracePeriodEnd: Date | null;
  defaultPaymentMethodId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  tier: SubscriptionTier;
  description: string;
  price: number;
  billingInterval: BillingInterval;
  features: string[];
  limits: Record<string, number>;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord {
  id: string;
  subscriptionId: string;
  userId: string;
  usageType: UsageType;
  amount: number;
  limitAmount: number;
  softLimit: number | null;
  overageAmount: number;
  overageFee: number;
  periodStart: Date;
  periodEnd: Date;
  lastReset: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageEvent {
  id: string;
  subscriptionId: string;
  userId: string;
  usageType: string;
  amount: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  userId: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: Date;
  paidAt: Date | null;
  lineItems: InvoiceLineItem[];
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Payment {
  id: string;
  paymentId: number;
  subscriptionId: string;
  invoiceId: string | null;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethodId: string | null;
  paymentMethodType: PaymentMethodType;
  failureReason: string | null;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date | null;
  executedAt: Date | null;
  refundedAt: Date | null;
  refundAmount: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  methodId: string;
  methodType: PaymentMethodType;
  isDefault: boolean;
  walletAddress: string | null;
  details: Record<string, unknown> | null;
  autoRechargeEnabled: boolean;
  autoRechargeThreshold: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  budget: number;
  spent: number;
  dailyBudget: number | null;
  startDate: Date;
  endDate: Date | null;
  targetingRules: TargetingRules | null;
  creativeIds: string[];
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TargetingRules {
  locations?: string[];
  languages?: string[];
  devices?: string[];
  interests?: string[];
  ageRange?: { min: number; max: number };
  keywords?: string[];
}

export interface User {
  id: string;
  walletAddress: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
  isVerified: boolean;
  tier: SubscriptionTier;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  action: string;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AnalyticsSummary {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
}

export interface AnalyticsTimeSeries {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface WebhookEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  lastAttemptAt: Date | null;
  createdAt: Date;
}
