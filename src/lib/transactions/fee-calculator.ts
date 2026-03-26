// Stacks Transactions fee calculation utilities

export const MIN_FEE = BigInt(180);

export const DEFAULT_FEE = BigInt(1000);

export const FEE_RATE = BigInt(180);

export type FeeEstimate = { low: bigint; medium: bigint; high: bigint };
