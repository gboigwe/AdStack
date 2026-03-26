// Clarity v4 Block Time Helpers

export const AVERAGE_BLOCK_SECONDS = 600;

export const BLOCKS_PER_MINUTE = 0.1;
export const BLOCKS_PER_HOUR = 6;
export const BLOCKS_PER_DAY = 144;
export const BLOCKS_PER_WEEK = 1008;
export const BLOCKS_PER_MONTH = 4320;
export const BLOCKS_PER_YEAR = 52560;

export type BlockDuration = {
  blocks: bigint;
  approximateSeconds: bigint;
};

export type BlockExpiry = {
  startBlock: bigint;
  durationBlocks: bigint;
  expiryBlock: bigint;
};

export function makeBlockDuration(blocks: bigint): BlockDuration {
  return {
    blocks,
    approximateSeconds: blocks * BigInt(AVERAGE_BLOCK_SECONDS),
  };
}

export function durationFromDays(days: number): BlockDuration {
  return makeBlockDuration(BigInt(Math.round(days * BLOCKS_PER_DAY)));
}

export function durationFromHours(hours: number): BlockDuration {
  return makeBlockDuration(BigInt(Math.round(hours * BLOCKS_PER_HOUR)));
}

export function durationFromWeeks(weeks: number): BlockDuration {
  return makeBlockDuration(BigInt(Math.round(weeks * BLOCKS_PER_WEEK)));
}

export function makeBlockExpiry(startBlock: bigint, durationBlocks: bigint): BlockExpiry {
  return { startBlock, durationBlocks, expiryBlock: startBlock + durationBlocks };
}
