/**
 * Escrow Vault Contract Interactions
 * Handles escrow creation, releases, and approvals
 */

import { openContractCall } from '@stacks/connect';
import {
  AnchorMode,
  PostConditionMode,
  uintCV,
  principalCV,
  listCV,
  FungibleConditionCode,
  makeStandardSTXPostCondition
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';

export interface Escrow {
  escrowId: number;
  campaignId: number;
  beneficiary: string;
  amount: bigint;
  releasedAmount: bigint;
  timeLock: number;
  performanceThreshold: number;
  expiresAt: number;
  released: boolean;
  cancelled: boolean;
  approvalCount: number;
  requiredApprovers: string[];
  createdAt: number;
}

export interface CreateEscrowParams {
  campaignId: number;
  beneficiary: string;
  amount: bigint;
  timeLockDuration: number;
  performanceThreshold: number;
  expiresIn: number;
  requiredApprovers: string[];
  network: StacksNetwork;
  contractAddress: string;
  userAddress: string;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export interface ReleaseEscrowParams {
  escrowId: number;
  network: StacksNetwork;
  contractAddress: string;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export interface PartialReleaseParams {
  escrowId: number;
  amount: bigint;
  network: StacksNetwork;
  contractAddress: string;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export interface ApproveReleaseParams {
  escrowId: number;
  network: StacksNetwork;
  contractAddress: string;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

/**
 * Create an escrow
 */
export async function createEscrow({
  campaignId,
  beneficiary,
  amount,
  timeLockDuration,
  performanceThreshold,
  expiresIn,
  requiredApprovers,
  network,
  contractAddress,
  userAddress,
  onFinish,
  onCancel
}: CreateEscrowParams) {
  const functionArgs = [
    uintCV(campaignId),
    principalCV(beneficiary),
    uintCV(amount),
    uintCV(timeLockDuration),
    uintCV(performanceThreshold),
    uintCV(expiresIn),
    listCV(requiredApprovers.map(addr => principalCV(addr)))
  ];

  // Post condition: user must send exact amount
  const postConditions = [
    makeStandardSTXPostCondition(
      userAddress,
      FungibleConditionCode.Equal,
      amount
    )
  ];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: 'escrow-vault',
    functionName: 'create-escrow',
    functionArgs,
    postConditionMode: PostConditionMode.Deny,
    postConditions,
    onFinish,
    onCancel
  });
}

/**
 * Release escrow funds
 */
export async function releaseEscrow({
  escrowId,
  network,
  contractAddress,
  onFinish,
  onCancel
}: ReleaseEscrowParams) {
  const functionArgs = [uintCV(escrowId)];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: 'escrow-vault',
    functionName: 'release-escrow',
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish,
    onCancel
  });
}

/**
 * Partial release of escrow funds
 */
export async function partialRelease({
  escrowId,
  amount,
  network,
  contractAddress,
  onFinish,
  onCancel
}: PartialReleaseParams) {
  const functionArgs = [
    uintCV(escrowId),
    uintCV(amount)
  ];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: 'escrow-vault',
    functionName: 'partial-release',
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish,
    onCancel
  });
}

/**
 * Approve escrow release
 */
export async function approveRelease({
  escrowId,
  network,
  contractAddress,
  onFinish,
  onCancel
}: ApproveReleaseParams) {
  const functionArgs = [uintCV(escrowId)];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: 'escrow-vault',
    functionName: 'approve-release',
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish,
    onCancel
  });
}

/**
 * Cancel escrow and refund
 */
export async function cancelEscrow({
  escrowId,
  network,
  contractAddress,
  onFinish,
  onCancel
}: ReleaseEscrowParams) {
  const functionArgs = [uintCV(escrowId)];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: 'escrow-vault',
    functionName: 'cancel-escrow',
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish,
    onCancel
  });
}

/**
 * Get escrow status
 */
export function getEscrowStatus(escrow: Escrow): string {
  if (escrow.cancelled) return 'Cancelled';
  if (escrow.released) return 'Released';

  const now = Math.floor(Date.now() / 1000);
  if (now > escrow.expiresAt) return 'Expired';
  if (now < escrow.timeLock) return 'Time-Locked';
  if (escrow.approvalCount < escrow.requiredApprovers.length) return 'Pending Approvals';

  return 'Ready for Release';
}

/**
 * Calculate escrow progress
 */
export function calculateEscrowProgress(escrow: Escrow): number {
  if (escrow.amount === 0n) return 0;
  return Number((escrow.releasedAmount * 100n) / escrow.amount);
}

/**
 * Check if escrow can be released
 */
export function canReleaseEscrow(escrow: Escrow): boolean {
  if (escrow.released || escrow.cancelled) return false;

  const now = Math.floor(Date.now() / 1000);
  if (now > escrow.expiresAt) return false;
  if (now < escrow.timeLock) return false;
  if (escrow.approvalCount < escrow.requiredApprovers.length) return false;

  return true;
}

/**
 * Format escrow amount for display
 */
export function formatEscrowAmount(amount: bigint): string {
  const stx = Number(amount) / 1_000_000;
  return `${stx.toLocaleString()} STX`;
}
