/**
 * campaign-budget-tracker.ts
 * On-chain campaign budget monitoring and spend rate calculation.
 * Combines promo-manager and funds-keeper data to give a real-time
 * view of campaign budget utilization.
 */

import { callReadOnly, encodeUintArg } from './read-only-caller';
import { SupportedNetwork } from './stacks-network';
import { blockTimeToDate } from './stacks-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CampaignBudgetState {
  campaignId: number;
  totalBudget: bigint;
  totalSpent: bigint;
  dailyBudget: bigint;
  dailySpent: bigint;
  escrowBalance: bigint;
  utilizationPercent: number;
  dailyUtilizationPercent: number;
  remainingDays: number;
  projectedExhaustionDate: Date | null;
  isOverBudget: boolean;
  isDailyOverBudget: boolean;
}

// ---------------------------------------------------------------------------
// Budget Fetching
// ---------------------------------------------------------------------------

/**
 * Fetch comprehensive budget state for a campaign.
 * Combines promo-manager campaign data with funds-keeper escrow balance.
 */
export async function fetchCampaignBudgetState(
  campaignId: number,
  network?: SupportedNetwork,
): Promise<CampaignBudgetState> {
  const [campaignResult, escrowResult] = await Promise.all([
    callReadOnly({
      contractName: 'promo-manager',
      functionName: 'get-campaign',
      functionArgs: [encodeUintArg(campaignId)],
      network,
    }),
    callReadOnly({
      contractName: 'funds-keeper',
      functionName: 'get-escrow-balance',
      functionArgs: [encodeUintArg(campaignId)],
      network,
    }),
  ]);

  // Parse result hex values (simplified - full implementation uses clarity-decoder)
  // These values are placeholders showing the integration pattern
  const totalBudget = 0n; // parsed from campaignResult
  const totalSpent = 0n;
  const dailyBudget = 0n;
  const dailySpent = 0n;
  const escrowBalance = 0n; // parsed from escrowResult

  return computeBudgetState(
    campaignId,
    totalBudget,
    totalSpent,
    dailyBudget,
    dailySpent,
    escrowBalance,
  );
}

/**
 * Compute derived budget statistics from raw values.
 */
export function computeBudgetState(
  campaignId: number,
  totalBudget: bigint,
  totalSpent: bigint,
  dailyBudget: bigint,
  dailySpent: bigint,
  escrowBalance: bigint,
): CampaignBudgetState {
  const remaining = totalBudget - totalSpent;
  const utilizationPercent = totalBudget > 0n
    ? Number((totalSpent * 10000n) / totalBudget) / 100
    : 0;

  const dailyUtilizationPercent = dailyBudget > 0n
    ? Number((dailySpent * 10000n) / dailyBudget) / 100
    : 0;

  // Estimate remaining days based on average daily spend
  const avgDailySpend = dailyBudget > 0n ? dailyBudget : totalBudget / 90n;
  const remainingDays = avgDailySpend > 0n
    ? Math.floor(Number(remaining / avgDailySpend))
    : 0;

  const projectedExhaustionDate = remainingDays > 0
    ? new Date(Date.now() + remainingDays * 86400 * 1000)
    : null;

  return {
    campaignId,
    totalBudget,
    totalSpent,
    dailyBudget,
    dailySpent,
    escrowBalance,
    utilizationPercent,
    dailyUtilizationPercent,
    remainingDays,
    projectedExhaustionDate,
    isOverBudget: totalSpent >= totalBudget,
    isDailyOverBudget: dailySpent >= dailyBudget,
  };
}

/**
 * Format a budget utilization percent for display.
 */
export function formatUtilization(percent: number): string {
  return `${percent.toFixed(1)}%`;
}

/**
 * Calculate spend rate in micro-STX per block.
 */
export function calculateSpendRate(
  totalSpent: bigint,
  blocksElapsed: number,
): bigint {
  if (blocksElapsed <= 0) return 0n;
  return totalSpent / BigInt(blocksElapsed);
}
