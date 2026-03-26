// Clarity v4 Post Condition Type Helpers

export type PostConditionCode = 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'not';

export type StxPostCondition = {
  type: 'stx';
  principal: string;
  conditionCode: PostConditionCode;
  amount: bigint;
};

export type FtPostCondition = {
  type: 'ft';
  principal: string;
  assetInfo: { contractId: string; assetName: string };
  conditionCode: PostConditionCode;
  amount: bigint;
};

export type NftPostCondition = {
  type: 'nft';
  principal: string;
  assetInfo: { contractId: string; assetName: string };
  tokenId: bigint;
  conditionCode: 'has' | 'not-has';
};

export type PostCondition = StxPostCondition | FtPostCondition | NftPostCondition;

export function makeStxPostCondition(
  principal: string,
  conditionCode: PostConditionCode,
  amount: bigint
): StxPostCondition {
  return { type: 'stx', principal, conditionCode, amount };
}

export function makeFtPostCondition(
  principal: string,
  contractId: string,
  assetName: string,
  conditionCode: PostConditionCode,
  amount: bigint
): FtPostCondition {
  return { type: 'ft', principal, assetInfo: { contractId, assetName }, conditionCode, amount };
}

export function makeNftPostCondition(
  principal: string,
  contractId: string,
  assetName: string,
  tokenId: bigint,
  conditionCode: 'has' | 'not-has'
): NftPostCondition {
  return { type: 'nft', principal, assetInfo: { contractId, assetName }, tokenId, conditionCode };
}

export function isStxPostCondition(pc: PostCondition): pc is StxPostCondition {
  return pc.type === 'stx';
}

export function isFtPostCondition(pc: PostCondition): pc is FtPostCondition {
  return pc.type === 'ft';
}

export function isNftPostCondition(pc: PostCondition): pc is NftPostCondition {
  return pc.type === 'nft';
}
