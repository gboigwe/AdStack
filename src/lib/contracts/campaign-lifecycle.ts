/**
 * Campaign Lifecycle Contract Interactions
 * Provides utilities for managing campaign states and transitions
 */

import { openContractCall } from '@stacks/connect';
import {
  AnchorMode,
  PostConditionMode,
  uintCV,
  principalCV,
  stringAsciiCV,
  listCV,
  FungibleConditionCode,
  makeStandardSTXPostCondition
} from '@stacks/transactions';
import { StacksNetwork } from '@stacks/network';

// Contract identifiers
export const CAMPAIGN_LIFECYCLE_CONTRACT = 'campaign-lifecycle';
export const ESCROW_VAULT_CONTRACT = 'escrow-vault';
export const AUCTION_ENGINE_CONTRACT = 'auction-engine';
export const PERFORMANCE_ORACLE_CONTRACT = 'performance-oracle';
export const PAYOUT_AUTOMATION_CONTRACT = 'payout-automation';

// Campaign states
export enum CampaignState {
  DRAFT = 0,
  FUNDED = 1,
  ACTIVE = 2,
  PAUSED = 3,
  COMPLETED = 4,
  CANCELLED = 5
}

export interface Campaign {
  campaignId: number;
  owner: string;
  name: string;
  budget: bigint;
  currentFunding: bigint;
  fundingThreshold: bigint;
  state: CampaignState;
  startTime: number;
  endTime: number;
  escrowId: number;
  metadata: string;
}

export interface CreateCampaignParams {
  name: string;
  budget: bigint;
  fundingThreshold: bigint;
  startTime: number;
  endTime: number;
  metadata: string;
  network: StacksNetwork;
  contractAddress: string;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export interface FundCampaignParams {
  campaignId: number;
  amount: bigint;
  network: StacksNetwork;
  contractAddress: string;
  userAddress: string;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export interface TransitionStateParams {
  campaignId: number;
  newState: CampaignState;
  network: StacksNetwork;
  contractAddress: string;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

/**
 * Create a new campaign
 */
export async function createCampaign({
  name,
  budget,
  fundingThreshold,
  startTime,
  endTime,
  metadata,
  network,
  contractAddress,
  onFinish,
  onCancel
}: CreateCampaignParams) {
  const functionArgs = [
    stringAsciiCV(name),
    uintCV(budget),
    uintCV(fundingThreshold),
    uintCV(startTime),
    uintCV(endTime),
    stringAsciiCV(metadata)
  ];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: CAMPAIGN_LIFECYCLE_CONTRACT,
    functionName: 'create-campaign',
    functionArgs,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [],
    onFinish,
    onCancel
  });
}

/**
 * Fund a campaign
 */
export async function fundCampaign({
  campaignId,
  amount,
  network,
  contractAddress,
  userAddress,
  onFinish,
  onCancel
}: FundCampaignParams) {
  const functionArgs = [
    uintCV(campaignId),
    uintCV(amount)
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
    contractName: CAMPAIGN_LIFECYCLE_CONTRACT,
    functionName: 'fund-campaign',
    functionArgs,
    postConditionMode: PostConditionMode.Deny,
    postConditions,
    onFinish,
    onCancel
  });
}

/**
 * Activate a funded campaign
 */
export async function activateCampaign({
  campaignId,
  network,
  contractAddress,
  onFinish,
  onCancel
}: Omit<TransitionStateParams, 'newState'>) {
  const functionArgs = [uintCV(campaignId)];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: CAMPAIGN_LIFECYCLE_CONTRACT,
    functionName: 'activate-campaign',
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish,
    onCancel
  });
}

/**
 * Pause an active campaign
 */
export async function pauseCampaign({
  campaignId,
  network,
  contractAddress,
  onFinish,
  onCancel
}: Omit<TransitionStateParams, 'newState'>) {
  const functionArgs = [uintCV(campaignId)];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: CAMPAIGN_LIFECYCLE_CONTRACT,
    functionName: 'pause-campaign',
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish,
    onCancel
  });
}

/**
 * Resume a paused campaign
 */
export async function resumeCampaign({
  campaignId,
  network,
  contractAddress,
  onFinish,
  onCancel
}: Omit<TransitionStateParams, 'newState'>) {
  const functionArgs = [uintCV(campaignId)];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: CAMPAIGN_LIFECYCLE_CONTRACT,
    functionName: 'resume-campaign',
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish,
    onCancel
  });
}

/**
 * Complete a campaign
 */
export async function completeCampaign({
  campaignId,
  network,
  contractAddress,
  onFinish,
  onCancel
}: Omit<TransitionStateParams, 'newState'>) {
  const functionArgs = [uintCV(campaignId)];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: CAMPAIGN_LIFECYCLE_CONTRACT,
    functionName: 'complete-campaign',
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish,
    onCancel
  });
}

/**
 * Cancel a campaign
 */
export async function cancelCampaign({
  campaignId,
  network,
  contractAddress,
  onFinish,
  onCancel
}: Omit<TransitionStateParams, 'newState'>) {
  const functionArgs = [uintCV(campaignId)];

  await openContractCall({
    network,
    anchorMode: AnchorMode.Any,
    contractAddress,
    contractName: CAMPAIGN_LIFECYCLE_CONTRACT,
    functionName: 'cancel-campaign',
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish,
    onCancel
  });
}

/**
 * Get campaign state name
 */
export function getCampaignStateName(state: CampaignState): string {
  switch (state) {
    case CampaignState.DRAFT:
      return 'Draft';
    case CampaignState.FUNDED:
      return 'Funded';
    case CampaignState.ACTIVE:
      return 'Active';
    case CampaignState.PAUSED:
      return 'Paused';
    case CampaignState.COMPLETED:
      return 'Completed';
    case CampaignState.CANCELLED:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

/**
 * Get available state transitions
 */
export function getAvailableTransitions(currentState: CampaignState): CampaignState[] {
  switch (currentState) {
    case CampaignState.DRAFT:
      return [CampaignState.FUNDED, CampaignState.CANCELLED];
    case CampaignState.FUNDED:
      return [CampaignState.ACTIVE, CampaignState.CANCELLED];
    case CampaignState.ACTIVE:
      return [CampaignState.PAUSED, CampaignState.COMPLETED, CampaignState.CANCELLED];
    case CampaignState.PAUSED:
      return [CampaignState.ACTIVE, CampaignState.COMPLETED, CampaignState.CANCELLED];
    case CampaignState.COMPLETED:
    case CampaignState.CANCELLED:
      return [];
    default:
      return [];
  }
}

/**
 * Check if state transition is valid
 */
export function isValidTransition(from: CampaignState, to: CampaignState): boolean {
  const validTransitions = getAvailableTransitions(from);
  return validTransitions.includes(to);
}
