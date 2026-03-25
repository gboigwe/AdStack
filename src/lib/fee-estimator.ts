/**
 * fee-estimator.ts
 * Transaction fee estimation for Stacks contract calls.
 * Fetches fee estimates from the Hiro API and applies multipliers.
 */

import { getApiUrl, SupportedNetwork } from './stacks-network';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeeEstimate {
  fee: bigint;
  feeRate: number;
  estimatedFee: bigint;
  costFunction?: string;
}

export interface FeeResponse {
  estimated_cost: {
    read_count: number;
    read_length: number;
    runtime: number;
    write_count: number;
    write_length: number;
  };
  estimated_cost_scalar: number;
  estimations: Array<{
    fee: number;
    fee_rate: number;
  }>;
  cost_scalar_change_by_byte: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum transaction fee in micro-STX */
export const MIN_TX_FEE = 400n;
/** Default fee multiplier for congestion buffer */
export const DEFAULT_FEE_MULTIPLIER = 1.2;
/** High-priority fee multiplier */
export const HIGH_PRIORITY_MULTIPLIER = 1.5;

// ---------------------------------------------------------------------------
// Fee Estimation
// ---------------------------------------------------------------------------

/**
 * Fetch fee estimates from the Hiro API for a serialized transaction.
 * Returns the medium estimate with an optional multiplier applied.
 */
export async function estimateTransactionFee(
  transactionBytes: Uint8Array,
  options: {
    network?: SupportedNetwork;
    multiplier?: number;
    priority?: 'low' | 'medium' | 'high';
  } = {},
): Promise<bigint> {
  const { network, multiplier = DEFAULT_FEE_MULTIPLIER, priority = 'medium' } = options;
  const apiUrl = getApiUrl(network);

  try {
    const response = await fetch(`${apiUrl}/v2/fees/transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: transactionBytes,
    });

    if (!response.ok) {
      return applyMultiplier(MIN_TX_FEE, multiplier);
    }

    const data: FeeResponse = await response.json();
    const estimations = data.estimations;

    if (!estimations?.length) {
      return applyMultiplier(MIN_TX_FEE, multiplier);
    }

    const idx = priority === 'low' ? 0 : priority === 'high' ? 2 : 1;
    const chosen = estimations[Math.min(idx, estimations.length - 1)];
    const fee = BigInt(Math.ceil(chosen.fee));

    return applyMultiplier(fee < MIN_TX_FEE ? MIN_TX_FEE : fee, multiplier);
  } catch {
    return applyMultiplier(MIN_TX_FEE, multiplier);
  }
}

/**
 * Estimate fee for a contract call based on function complexity.
 * Uses predefined estimates per contract function when API unavailable.
 */
export function estimateFeeByFunction(
  contractName: string,
  functionName: string,
): bigint {
  const key = `${contractName}::${functionName}`;

  const FUNCTION_FEE_MAP: Record<string, bigint> = {
    'promo-manager::create-campaign': 3000n,
    'promo-manager::cancel-campaign': 1500n,
    'promo-manager::refund-campaign-budget': 2000n,
    'funds-keeper::create-escrow': 2500n,
    'funds-keeper::release-to-publisher': 3000n,
    'funds-keeper::refund-advertiser': 2500n,
    'cash-distributor::record-earnings': 2000n,
    'cash-distributor::claim-payout': 3000n,
    'stats-tracker::submit-view': 2000n,
    'vote-handler::create-proposal': 2500n,
    'vote-handler::cast-vote': 1800n,
    'vote-handler::finalize-proposal': 2000n,
    'user-profiles::register': 2000n,
    'audience-selector::create-segment': 2500n,
    'partner-hub::propose-partnership': 2000n,
    'partner-hub::accept-partnership': 1800n,
  };

  return FUNCTION_FEE_MAP[key] ?? 2000n;
}

function applyMultiplier(fee: bigint, multiplier: number): bigint {
  return BigInt(Math.ceil(Number(fee) * multiplier));
}
