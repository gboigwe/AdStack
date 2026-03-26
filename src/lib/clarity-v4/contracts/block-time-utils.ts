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

export function isExpiryReached(expiry: BlockExpiry, currentBlock: bigint): boolean {
  return currentBlock >= expiry.expiryBlock;
}

export function hasStarted(expiry: BlockExpiry, currentBlock: bigint): boolean {
  return currentBlock >= expiry.startBlock;
}

export function isActive(expiry: BlockExpiry, currentBlock: bigint): boolean {
  return hasStarted(expiry, currentBlock) && !isExpiryReached(expiry, currentBlock);
}

export function remainingBlocksUntilExpiry(expiry: BlockExpiry, currentBlock: bigint): bigint {
  if (isExpiryReached(expiry, currentBlock)) return BigInt(0);
  return expiry.expiryBlock - currentBlock;
}

export function blocksElapsed(expiry: BlockExpiry, currentBlock: bigint): bigint {
  if (!hasStarted(expiry, currentBlock)) return BigInt(0);
  return minBigInt(currentBlock - expiry.startBlock, expiry.durationBlocks);
}

function minBigInt(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

export function progressPercent(expiry: BlockExpiry, currentBlock: bigint): number {
  if (expiry.durationBlocks === BigInt(0)) return 100;
  const elapsed = blocksElapsed(expiry, currentBlock);
  return Math.min(100, Number((elapsed * BigInt(100)) / expiry.durationBlocks));
}

export function extendExpiry(expiry: BlockExpiry, additionalBlocks: bigint): BlockExpiry {
  return makeBlockExpiry(expiry.startBlock, expiry.durationBlocks + additionalBlocks);
}

export function blockToApproxDate(blockHeight: bigint, genesisTimestamp: number): Date {
  const secondsSinceGenesis = Number(blockHeight) * AVERAGE_BLOCK_SECONDS;
  return new Date((genesisTimestamp + secondsSinceGenesis) * 1000);
}
