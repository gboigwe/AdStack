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
