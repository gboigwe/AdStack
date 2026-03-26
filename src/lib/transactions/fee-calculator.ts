// Stacks Transactions fee calculation utilities

export const MIN_FEE = BigInt(180);

export const DEFAULT_FEE = BigInt(1000);

export const FEE_RATE = BigInt(180);

export type FeeEstimate = { low: bigint; medium: bigint; high: bigint };

export type TxSize = { bytes: number };

export function calculateFee(txSizeBytes: number, feeRate = FEE_RATE): bigint {
  return BigInt(txSizeBytes) * feeRate;
}

export function makeFeeEstimate(baseFee: bigint): FeeEstimate {
  return {
    low: baseFee,
    medium: (baseFee * BigInt(15)) / BigInt(10),
    high: baseFee * BigInt(2),
  };
}

export function estimateContractCallFee(numArgs: number): FeeEstimate {
  const baseSize = 200 + numArgs * 50;
  return makeFeeEstimate(calculateFee(baseSize));
}

export function estimateTokenTransferFee(): FeeEstimate {
  return makeFeeEstimate(calculateFee(200));
}

export function clampFee(fee: bigint, min = MIN_FEE): bigint {
  return fee < min ? min : fee;
}

export function feeInStx(feeUstx: bigint): string {
  return `${Number(feeUstx) / 1_000_000} STX`;
}

export const FEE_TIER_1 = BigInt(100);

export const FEE_TIER_2 = BigInt(200);

export const FEE_TIER_3 = BigInt(300);

export const FEE_TIER_4 = BigInt(400);

export const FEE_TIER_5 = BigInt(500);

export const FEE_TIER_6 = BigInt(600);

export const FEE_TIER_7 = BigInt(700);

export const FEE_TIER_8 = BigInt(800);

export const FEE_TIER_9 = BigInt(900);

export const FEE_TIER_10 = BigInt(1000);

export const FEE_TIER_11 = BigInt(1100);

export const FEE_TIER_12 = BigInt(1200);

export const FEE_TIER_13 = BigInt(1300);

export const FEE_TIER_14 = BigInt(1400);

export const FEE_TIER_15 = BigInt(1500);

export const FEE_TIER_16 = BigInt(1600);

export const FEE_TIER_17 = BigInt(1700);

export const FEE_TIER_18 = BigInt(1800);

export const FEE_TIER_19 = BigInt(1900);

export const FEE_TIER_20 = BigInt(2000);

export const FEE_TIER_21 = BigInt(2100);

export const FEE_TIER_22 = BigInt(2200);

export const FEE_TIER_23 = BigInt(2300);

export const FEE_TIER_24 = BigInt(2400);

export const FEE_TIER_25 = BigInt(2500);

export const FEE_TIER_26 = BigInt(2600);

export const FEE_TIER_27 = BigInt(2700);

export const FEE_TIER_28 = BigInt(2800);

export const FEE_TIER_29 = BigInt(2900);

export const FEE_TIER_30 = BigInt(3000);
