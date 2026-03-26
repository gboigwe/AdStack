// Clarity v4 Consensus and Block Utilities

export type BlockInfo = {
  height: bigint;
  hash: string;
  burnBlockHeight: bigint;
  miner: string;
  time: bigint;
};

export type StacksEpoch = 'epoch-2.0' | 'epoch-2.1' | 'epoch-2.2' | 'epoch-2.3' | 'epoch-2.4' | 'epoch-2.5' | 'epoch-3.0';

export const EPOCH_3_START_BLOCK = BigInt(666050);

export function isEpoch3OrLater(blockHeight: bigint): boolean {
  return blockHeight >= EPOCH_3_START_BLOCK;
}

export function blockHashToHex(hash: string): string {
  return hash.startsWith('0x') ? hash : `0x${hash}`;
}
