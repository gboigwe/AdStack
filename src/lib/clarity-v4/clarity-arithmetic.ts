// Clarity v4 Arithmetic and Math Utilities

import { ClarityUint, ClarityInt, makeUint, makeInt, MAX_UINT128 } from './clarity-primitives';

export const ONE_STX_IN_USTX = BigInt(1_000_000);

export const BLOCKS_PER_DAY = BigInt(144);

export const BLOCKS_PER_WEEK = BLOCKS_PER_DAY * BigInt(7);

export const BLOCKS_PER_YEAR = BLOCKS_PER_DAY * BigInt(365);

export function stxToUstx(stx: bigint): ClarityUint {
  return makeUint(stx * ONE_STX_IN_USTX);
}

export function ustxToStx(ustx: bigint): bigint {
  return ustx / ONE_STX_IN_USTX;
}

export function blocksToSeconds(blocks: bigint): bigint {
  return blocks * BigInt(600); // ~10 min per block
}

export function secondsToBlocks(seconds: bigint): bigint {
  return seconds / BigInt(600);
}

export function safeAddUint(a: ClarityUint, b: ClarityUint): ClarityUint | null {
  const sum = a.value + b.value;
  if (sum > MAX_UINT128) return null;
  return makeUint(sum);
}

export function safeSubUint(a: ClarityUint, b: ClarityUint): ClarityUint | null {
  if (b.value > a.value) return null;
  return makeUint(a.value - b.value);
}

export function percentOf(amount: bigint, basisPoints: bigint): bigint {
  return (amount * basisPoints) / BigInt(10000);
}

export function clampUint(value: bigint, min: bigint, max: bigint): bigint {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function minBigInt(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

export function maxBigInt(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

export function absDiffUint(a: bigint, b: bigint): bigint {
  return a > b ? a - b : b - a;
}

export function isPowerOfTwo(n: bigint): boolean {
  if (n <= BigInt(0)) return false;
  return (n & (n - BigInt(1))) === BigInt(0);
}

export function daysToBlocks(days: bigint): bigint {
  return days * BLOCKS_PER_DAY;
}

export function weeksToDays(weeks: bigint): bigint {
  return weeks * BigInt(7);
}

export function calculateExpiry(currentBlock: bigint, durationBlocks: bigint): bigint {
  return currentBlock + durationBlocks;
}

export function isExpired(currentBlock: bigint, expiryBlock: bigint): boolean {
  return currentBlock >= expiryBlock;
}
