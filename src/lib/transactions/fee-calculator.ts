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
