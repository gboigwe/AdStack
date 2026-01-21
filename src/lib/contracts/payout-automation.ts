/**
 * Payout Automation Contract Interactions
 * Manages automated payouts and batch processing
 */

import { openContractCall } from '@stacks/connect';
import {
  AnchorMode,
  PostConditionMode,
  uintCV,
  principalCV,
  listCV,
  tupleCV
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';

export interface PayoutRecipient {
  recipient: string;
  amount: bigint;
}

export interface PayoutBatch {
  batchId: number;
  campaignId: number;
  totalAmount: bigint;
  recipientCount: number;
  processedCount: number;
  status: PayoutBatchStatus;
  createdAt: number;
  executedAt: number;
  executedBy: string;
}

export enum PayoutBatchStatus {
  PENDING = 0,
  PROCESSING = 1,
  COMPLETED = 2,
  FAILED = 3
}

export interface CreatePayoutBatchParams {
  campaignId: number;
  recipients: PayoutRecipient[];
  network: StacksNetwork;
  contractAddress: string;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export interface ExecutePayoutBatchParams {
  batchId: number;
  network: StacksNetwork;
  contractAddress: string;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export interface PerformancePayoutParams {
  campaignId: number;
  publisher: string;
  views: number;
  clicks: number;
  qualityScore: number;
  network: StacksNetwork;
  contractAddress: string;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export interface ScheduledPayoutParams {
  campaignId: number;
  recipient: string;
  amount: bigint;
  scheduledTime: number;
  recurrenceInterval: number;
  network: StacksNetwork;
  contractAddress: string;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

/**
 * Create a payout batch
 */
export async function createPayoutBatch({
  campaignId,
  recipients,
  network,
  contractAddress,
  onFinish,
  onCancel
}: CreatePayoutBatchParams) {
  // Convert recipients to tuple format
  const recipientTuples = recipients.map(r =>
    tupleCV({
      recipient: principalCV(r.recipient),
      amount: uintCV(r.amount)
    })
  );

  const functionArgs = [
    uintCV(campaignId),
    listCV(recipientTuples)
  ];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: 'payout-automation',
    functionName: 'create-payout-batch',
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish,
    onCancel
  });
}

/**
 * Execute a payout batch
 */
export async function executePayoutBatch({
  batchId,
  network,
  contractAddress,
  onFinish,
  onCancel
}: ExecutePayoutBatchParams) {
  const functionArgs = [uintCV(batchId)];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: 'payout-automation',
    functionName: 'execute-payout-batch',
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish,
    onCancel
  });
}

/**
 * Calculate performance-based payout
 */
export async function calculatePerformancePayout({
  campaignId,
  publisher,
  views,
  clicks,
  qualityScore,
  network,
  contractAddress,
  onFinish,
  onCancel
}: PerformancePayoutParams) {
  const functionArgs = [
    uintCV(campaignId),
    principalCV(publisher),
    uintCV(views),
    uintCV(clicks),
    uintCV(qualityScore)
  ];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: 'payout-automation',
    functionName: 'calculate-performance-payout',
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish,
    onCancel
  });
}

/**
 * Schedule a recurring payout
 */
export async function scheduleRecurringPayout({
  campaignId,
  recipient,
  amount,
  scheduledTime,
  recurrenceInterval,
  network,
  contractAddress,
  onFinish,
  onCancel
}: ScheduledPayoutParams) {
  const functionArgs = [
    uintCV(campaignId),
    principalCV(recipient),
    uintCV(amount),
    uintCV(scheduledTime),
    uintCV(recurrenceInterval)
  ];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: 'payout-automation',
    functionName: 'schedule-recurring-payout',
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish,
    onCancel
  });
}

/**
 * Execute scheduled payouts
 */
export async function executeScheduledPayouts({
  campaignId,
  network,
  contractAddress,
  onFinish,
  onCancel
}: Omit<PerformancePayoutParams, 'publisher' | 'views' | 'clicks' | 'qualityScore'>) {
  const functionArgs = [uintCV(campaignId)];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: 'payout-automation',
    functionName: 'execute-scheduled-payouts',
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish,
    onCancel
  });
}

/**
 * Get payout batch status name
 */
export function getPayoutBatchStatusName(status: PayoutBatchStatus): string {
  switch (status) {
    case PayoutBatchStatus.PENDING:
      return 'Pending';
    case PayoutBatchStatus.PROCESSING:
      return 'Processing';
    case PayoutBatchStatus.COMPLETED:
      return 'Completed';
    case PayoutBatchStatus.FAILED:
      return 'Failed';
    default:
      return 'Unknown';
  }
}

/**
 * Calculate batch progress
 */
export function calculateBatchProgress(batch: PayoutBatch): number {
  if (batch.recipientCount === 0) return 0;
  return (batch.processedCount / batch.recipientCount) * 100;
}

/**
 * Estimate gas cost for batch
 */
export function estimateBatchGasCost(recipientCount: number): bigint {
  // Base cost + per-recipient cost
  const baseCost = 10000n;
  const perRecipientCost = 2000n;
  return baseCost + (perRecipientCost * BigInt(recipientCount));
}

/**
 * Validate payout batch size
 */
export function validateBatchSize(recipientCount: number): boolean {
  const MAX_BATCH_SIZE = 50;
  return recipientCount > 0 && recipientCount <= MAX_BATCH_SIZE;
}

/**
 * Calculate total batch amount
 */
export function calculateTotalBatchAmount(recipients: PayoutRecipient[]): bigint {
  return recipients.reduce((sum, recipient) => sum + recipient.amount, 0n);
}

/**
 * Format payout amount for display
 */
export function formatPayoutAmount(amount: bigint): string {
  const stx = Number(amount) / 1_000_000;
  return `${stx.toLocaleString()} STX`;
}

/**
 * Group recipients into optimal batches
 */
export function groupIntoBatches(
  recipients: PayoutRecipient[],
  maxBatchSize: number = 50
): PayoutRecipient[][] {
  const batches: PayoutRecipient[][] = [];

  for (let i = 0; i < recipients.length; i += maxBatchSize) {
    batches.push(recipients.slice(i, i + maxBatchSize));
  }

  return batches;
}
