// Clarity v4 Post Condition Type Helpers

export type PostConditionCode = 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'not';

export type StxPostCondition = {
  type: 'stx';
  principal: string;
  conditionCode: PostConditionCode;
  amount: bigint;
};
