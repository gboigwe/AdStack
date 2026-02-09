/**
 * Subscription Service Library
 * API client, contract helpers, and utility functions for subscription management
 */

import { Cl, ClarityValue } from '@stacks/transactions';
import { callReadOnly } from './read-only-calls';
import { callContract } from './transaction-builder';
import { CONTRACT_ADDRESS, CONTRACTS } from './stacks-config';

/**
 * Type Definitions
 */

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';

export type BillingInterval = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface SubscriptionData {
  subscriptionId: number;
  campaignId: number;
  subscriber: string;
  amount: bigint;
  billingInterval: BillingInterval;
  status: SubscriptionStatus;
  nextBilling: number;
  createdAt: number;
  lastPayment: number;
  totalPayments: number;
  failedAttempts: number;
  autoRenew: boolean;
}

export interface SubscriptionPlan {
  planId: number;
  name: string;
  description: string;
  price: bigint;
  interval: BillingInterval;
  features: string[];
  active: boolean;
  discountPercent: number;
}

export interface SubscriptionAnalytics {
  totalRevenue: bigint;
  successfulPayments: number;
  failedPayments: number;
  avgPaymentAmount: bigint;
  lifetimeValue: bigint;
  churnRiskScore: number;
}

export interface CreateSubscriptionParams {
  campaignId: number;
  amount: bigint;
  billingInterval: number;
  autoRenew: boolean;
}

export interface ChangePlanParams {
  subscriptionId: number;
  newAmount: bigint;
}

export interface UsageMetrics {
  campaigns: {
    used: number;
    limit: number;
    percentage: number;
  };
  impressions: {
    used: number;
    limit: number;
    percentage: number;
  };
  apiCalls: {
    used: number;
    limit: number;
    percentage: number;
  };
  storage: {
    used: number;
    limit: number;
    percentage: number;
  };
  users: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export interface UsageLimit {
  current: number;
  limit: number;
  percentage: number;
  resourceType: string;
}

export interface UsageAlert {
  id: string;
  type: 'usage_limit';
  resourceType: 'campaigns' | 'impressions' | 'apiCalls' | 'storage' | 'users';
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  percentage: number;
  current: number;
  limit: number;
  timestamp: number;
  dismissed: boolean;
}

export interface UsageRecord {
  id: string;
  userAddress: string;
  resourceType: 'campaigns' | 'impressions' | 'apiCalls' | 'storage' | 'users';
  amount: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Billing Interval Constants (in seconds)
 */
export const BILLING_INTERVALS = {
  weekly: 604800,
  monthly: 2592000,
  quarterly: 7776000,
  yearly: 31536000,
} as const;

export const STATUS_CODES = {
  ACTIVE: 1,
  PAUSED: 2,
  CANCELLED: 3,
  EXPIRED: 4,
} as const;

/**
 * Subscription Status Helpers
 */

export function statusCodeToString(statusCode: number): SubscriptionStatus {
  switch (statusCode) {
    case STATUS_CODES.ACTIVE:
      return 'active';
    case STATUS_CODES.PAUSED:
      return 'paused';
    case STATUS_CODES.CANCELLED:
      return 'cancelled';
    case STATUS_CODES.EXPIRED:
      return 'expired';
    default:
      return 'cancelled';
  }
}

export function statusStringToCode(status: SubscriptionStatus): number {
  switch (status) {
    case 'active':
      return STATUS_CODES.ACTIVE;
    case 'paused':
      return STATUS_CODES.PAUSED;
    case 'cancelled':
      return STATUS_CODES.CANCELLED;
    case 'expired':
      return STATUS_CODES.EXPIRED;
  }
}

export function intervalCodeToString(intervalCode: number): BillingInterval {
  switch (intervalCode) {
    case BILLING_INTERVALS.weekly:
      return 'weekly';
    case BILLING_INTERVALS.monthly:
      return 'monthly';
    case BILLING_INTERVALS.quarterly:
      return 'quarterly';
    case BILLING_INTERVALS.yearly:
      return 'yearly';
    default:
      return 'monthly';
  }
}

export function intervalStringToCode(interval: BillingInterval): number {
  return BILLING_INTERVALS[interval];
}

/**
 * API Client Functions
 */

export async function getSubscription(subscriptionId: number): Promise<SubscriptionData | null> {
  try {
    const result = await callReadOnly({
      contractName: 'subscription-manager',
      functionName: 'get-subscription',
      functionArgs: [{ type: 'uint', value: BigInt(subscriptionId) }],
    });

    if (!result.success || !result.data) return null;

    return parseSubscriptionData(result.data);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

export async function getSubscriptionPlan(planId: number): Promise<SubscriptionPlan | null> {
  try {
    const result = await callReadOnly({
      contractName: 'subscription-manager',
      functionName: 'get-plan',
      functionArgs: [{ type: 'uint', value: BigInt(planId) }],
    });

    if (!result.success || !result.data) return null;

    return parseSubscriptionPlan(result.data);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return null;
  }
}

export async function getSubscriptionAnalytics(
  subscriptionId: number
): Promise<SubscriptionAnalytics | null> {
  try {
    const result = await callReadOnly({
      contractName: 'subscription-manager',
      functionName: 'get-subscription-analytics',
      functionArgs: [{ type: 'uint', value: BigInt(subscriptionId) }],
    });

    if (!result.success || !result.data) return null;

    return parseSubscriptionAnalytics(result.data);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return null;
  }
}

/**
 * Contract Interaction Helpers
 */

export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<{ success: boolean; subscriptionId?: number; error?: string }> {
  try {
    const result = await callContract({
      contractName: 'subscription-manager',
      functionName: 'create-subscription',
      functionArgs: [
        { type: 'uint', value: BigInt(params.campaignId) },
        { type: 'uint', value: params.amount },
        { type: 'uint', value: BigInt(params.billingInterval) },
        { type: 'bool', value: params.autoRenew },
      ],
    });

    if (result.success) {
      return {
        success: true,
        subscriptionId: 1, // Parse from transaction result
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to create subscription',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function cancelSubscription(
  subscriptionId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await callContract({
      contractName: 'subscription-manager',
      functionName: 'cancel-subscription',
      functionArgs: [{ type: 'uint', value: BigInt(subscriptionId) }],
    });

    return {
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Proration Utilities
 */

export function calculateProration(
  currentAmount: bigint,
  newAmount: bigint,
  daysUsed: number,
  totalDays: number
): {
  unusedAmount: bigint;
  prorationCredit: bigint;
  immediateCharge: bigint;
  effectivePrice: bigint;
} {
  const daysRemaining = totalDays - daysUsed;
  const unusedPercentage = BigInt(Math.floor((daysRemaining / totalDays) * 10000));

  // Calculate unused amount from current plan
  const unusedAmount = (currentAmount * unusedPercentage) / 10000n;

  // Calculate new plan amount for remaining period
  const newPeriodAmount = (newAmount * unusedPercentage) / 10000n;

  // Proration credit (can be negative if upgrading)
  const prorationCredit = unusedAmount - newPeriodAmount;

  // Immediate charge (if downgrading, this will be negative/refunded)
  const immediateCharge = prorationCredit < 0n ? -prorationCredit : 0n;

  // Effective price after proration
  const effectivePrice = newPeriodAmount - (prorationCredit > 0n ? prorationCredit : 0n);

  return {
    unusedAmount,
    prorationCredit,
    immediateCharge,
    effectivePrice,
  };
}

export function calculateNextBillingDate(
  currentDate: Date,
  interval: BillingInterval
): Date {
  const nextDate = new Date(currentDate);

  switch (interval) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  return nextDate;
}

export function daysUntilNextBilling(nextBillingTimestamp: number): number {
  const now = Date.now() / 1000;
  const secondsUntil = nextBillingTimestamp - now;
  return Math.ceil(secondsUntil / 86400);
}

export function isSubscriptionExpiringSoon(
  nextBillingTimestamp: number,
  daysThreshold: number = 7
): boolean {
  const daysUntil = daysUntilNextBilling(nextBillingTimestamp);
  return daysUntil <= daysThreshold && daysUntil >= 0;
}

/**
 * Date Calculation Utilities
 */

export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

export function dateToTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function formatNextBilling(timestamp: number): string {
  const date = timestampToDate(timestamp);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `in ${diffDays} days`;
  if (diffDays < 30) return `in ${Math.ceil(diffDays / 7)} weeks`;

  return date.toLocaleDateString();
}

export function getSubscriptionPeriod(
  startTimestamp: number,
  endTimestamp: number
): { start: Date; end: Date; days: number } {
  const start = timestampToDate(startTimestamp);
  const end = timestampToDate(endTimestamp);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return { start, end, days };
}

/**
 * Data Parsers
 */

function parseSubscriptionData(data: any): SubscriptionData {
  return {
    subscriptionId: Number(data.subscriptionId || 0),
    campaignId: Number(data['campaign-id'] || data.campaignId || 0),
    subscriber: data.subscriber || '',
    amount: BigInt(data.amount || 0),
    billingInterval: intervalCodeToString(Number(data['billing-interval'] || data.billingInterval || BILLING_INTERVALS.monthly)),
    status: statusCodeToString(Number(data.status || STATUS_CODES.ACTIVE)),
    nextBilling: Number(data['next-billing'] || data.nextBilling || 0),
    createdAt: Number(data['created-at'] || data.createdAt || 0),
    lastPayment: Number(data['last-payment'] || data.lastPayment || 0),
    totalPayments: Number(data['total-payments'] || data.totalPayments || 0),
    failedAttempts: Number(data['failed-attempts'] || data.failedAttempts || 0),
    autoRenew: Boolean(data['auto-renew'] || data.autoRenew || false),
  };
}

function parseSubscriptionPlan(data: any): SubscriptionPlan {
  return {
    planId: Number(data.planId || 0),
    name: data.name || '',
    description: data.description || '',
    price: BigInt(data.price || 0),
    interval: intervalCodeToString(Number(data.interval || BILLING_INTERVALS.monthly)),
    features: Array.isArray(data.features) ? data.features : [],
    active: Boolean(data.active ?? true),
    discountPercent: Number(data['discount-percent'] || data.discountPercent || 0),
  };
}

function parseSubscriptionAnalytics(data: any): SubscriptionAnalytics {
  return {
    totalRevenue: BigInt(data['total-revenue'] || data.totalRevenue || 0),
    successfulPayments: Number(data['successful-payments'] || data.successfulPayments || 0),
    failedPayments: Number(data['failed-payments'] || data.failedPayments || 0),
    avgPaymentAmount: BigInt(data['avg-payment-amount'] || data.avgPaymentAmount || 0),
    lifetimeValue: BigInt(data['lifetime-value'] || data.lifetimeValue || 0),
    churnRiskScore: Number(data['churn-risk-score'] || data.churnRiskScore || 0),
  };
}

/**
 * Usage Tracking Functions (Mock for now - replace with actual API)
 */

// In-memory storage for demo (replace with actual API calls)
const usageStore: Map<string, UsageMetrics> = new Map();
const usageHistoryStore: Map<string, UsageRecord[]> = new Map();

export async function getCurrentUsage(userAddress: string): Promise<UsageMetrics> {
  // Mock implementation - replace with actual API call
  const existing = usageStore.get(userAddress);
  if (existing) return existing;

  const defaultUsage: UsageMetrics = {
    campaigns: { used: 0, limit: 10, percentage: 0 },
    impressions: { used: 0, limit: 100000, percentage: 0 },
    apiCalls: { used: 0, limit: 10000, percentage: 0 },
    storage: { used: 0, limit: 10, percentage: 0 },
    users: { used: 0, limit: 5, percentage: 0 },
  };

  usageStore.set(userAddress, defaultUsage);
  return defaultUsage;
}

export async function checkUsageLimit(
  userAddress: string,
  resourceType: 'campaigns' | 'impressions' | 'apiCalls' | 'storage' | 'users'
): Promise<UsageLimit> {
  const usage = await getCurrentUsage(userAddress);
  const resource = usage[resourceType];

  return {
    current: resource.used,
    limit: resource.limit,
    percentage: resource.percentage,
    resourceType,
  };
}

export async function trackUsage(
  userAddress: string,
  resourceType: 'campaigns' | 'impressions' | 'apiCalls' | 'storage' | 'users',
  amount: number,
  metadata?: Record<string, any>
): Promise<void> {
  // Update usage metrics
  const usage = await getCurrentUsage(userAddress);
  const resource = usage[resourceType];

  resource.used += amount;
  resource.percentage = (resource.used / resource.limit) * 100;

  usageStore.set(userAddress, usage);

  // Add to history
  const history = usageHistoryStore.get(userAddress) || [];
  const record: UsageRecord = {
    id: `${userAddress}-${Date.now()}-${Math.random()}`,
    userAddress,
    resourceType,
    amount,
    timestamp: Date.now(),
    metadata,
  };

  history.push(record);
  usageHistoryStore.set(userAddress, history);
}

export async function getUsageHistory(
  userAddress: string,
  startDate?: Date,
  endDate?: Date
): Promise<UsageRecord[]> {
  const history = usageHistoryStore.get(userAddress) || [];

  if (!startDate && !endDate) return history;

  return history.filter((record) => {
    if (startDate && record.timestamp < startDate.getTime()) return false;
    if (endDate && record.timestamp > endDate.getTime()) return false;
    return true;
  });
}

/**
 * Error Handling
 */

export class SubscriptionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SubscriptionError';
  }
}

export function handleSubscriptionError(error: any): SubscriptionError {
  if (error instanceof SubscriptionError) return error;

  // Map contract errors
  if (error.message?.includes('err-owner-only')) {
    return new SubscriptionError('Permission denied', 'ERR_OWNER_ONLY');
  }
  if (error.message?.includes('err-not-found')) {
    return new SubscriptionError('Subscription not found', 'ERR_NOT_FOUND');
  }
  if (error.message?.includes('err-unauthorized')) {
    return new SubscriptionError('Unauthorized action', 'ERR_UNAUTHORIZED');
  }
  if (error.message?.includes('err-inactive-subscription')) {
    return new SubscriptionError('Subscription is inactive', 'ERR_INACTIVE');
  }
  if (error.message?.includes('err-already-exists')) {
    return new SubscriptionError('Subscription already exists', 'ERR_ALREADY_EXISTS');
  }
  if (error.message?.includes('err-invalid-interval')) {
    return new SubscriptionError('Invalid billing interval', 'ERR_INVALID_INTERVAL');
  }

  return new SubscriptionError(
    error.message || 'Unknown subscription error',
    'ERR_UNKNOWN',
    error
  );
}

/**
 * Validation Helpers
 */

export function isValidBillingInterval(interval: number): boolean {
  return Object.values(BILLING_INTERVALS).includes(interval as any);
}

export function isValidSubscriptionStatus(status: string): status is SubscriptionStatus {
  return ['active', 'paused', 'cancelled', 'expired'].includes(status);
}

export function canRenewSubscription(subscription: SubscriptionData): boolean {
  return (
    subscription.status === 'active' &&
    subscription.autoRenew &&
    subscription.failedAttempts < 3
  );
}

export function canCancelSubscription(subscription: SubscriptionData): boolean {
  return subscription.status === 'active' || subscription.status === 'paused';
}

export function canPauseSubscription(subscription: SubscriptionData): boolean {
  return subscription.status === 'active';
}

export function canResumeSubscription(subscription: SubscriptionData): boolean {
  return subscription.status === 'paused';
}

/**
 * Formatting Helpers
 */

export function formatSubscriptionAmount(amount: bigint): string {
  const microStx = Number(amount);
  const stx = microStx / 1_000_000;
  return `${stx.toLocaleString()} STX`;
}

export function formatBillingInterval(interval: BillingInterval): string {
  return interval.charAt(0).toUpperCase() + interval.slice(1);
}

export function getSubscriptionStatusColor(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'green';
    case 'paused':
      return 'yellow';
    case 'cancelled':
      return 'red';
    case 'expired':
      return 'gray';
  }
}

export function getChurnRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 20) return 'low';
  if (score < 50) return 'medium';
  return 'high';
}
