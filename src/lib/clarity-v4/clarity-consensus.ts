// Clarity v4 Consensus and Block Utilities

export type BlockInfo = {
  height: bigint;
  hash: string;
  burnBlockHeight: bigint;
  miner: string;
  time: bigint;
};
