// Stacks Transactions post condition builders

export type FungibleConditionCode = 'eq' | 'gt' | 'gte' | 'lt' | 'lte';

export type NonFungibleConditionCode = 'owns' | 'not_owns';

export type PrincipalType = 'origin' | 'standard' | 'contract';
