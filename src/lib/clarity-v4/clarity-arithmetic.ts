// Clarity v4 Arithmetic and Math Utilities

import { ClarityUint, ClarityInt, makeUint, makeInt, MAX_UINT128 } from './clarity-primitives';

export const ONE_STX_IN_USTX = BigInt(1_000_000);

export const BLOCKS_PER_DAY = BigInt(144);

export const BLOCKS_PER_WEEK = BLOCKS_PER_DAY * BigInt(7);

export const BLOCKS_PER_YEAR = BLOCKS_PER_DAY * BigInt(365);
