// Stacks Transactions post condition builders

export type FungibleConditionCode = 'eq' | 'gt' | 'gte' | 'lt' | 'lte';

export type NonFungibleConditionCode = 'owns' | 'not_owns';

export type PrincipalType = 'origin' | 'standard' | 'contract';

export type StxCondition = { type: 'stx'; principal: PrincipalDetail; code: FungibleConditionCode; amount: bigint };

export type FtCondition = { type: 'ft'; principal: PrincipalDetail; asset: AssetInfo; code: FungibleConditionCode; amount: bigint };

export type NftCondition = { type: 'nft'; principal: PrincipalDetail; asset: AssetInfo; tokenId: bigint; code: NonFungibleConditionCode };

export type PostCondition = StxCondition | FtCondition | NftCondition;

export type PrincipalDetail = { type: PrincipalType; address?: string; contractName?: string };

export type AssetInfo = { contractId: string; assetName: string };

export function originPrincipal(): PrincipalDetail {
  return { type: 'origin' };
}

export function standardPrincipalDetail(address: string): PrincipalDetail {
  return { type: 'standard', address };
}

export function contractPrincipalDetail(address: string, contractName: string): PrincipalDetail {
  return { type: 'contract', address, contractName };
}

export function makeStxCondition(
  principal: PrincipalDetail,
  code: FungibleConditionCode,
  amount: bigint
): StxCondition {
  return { type: 'stx', principal, code, amount };
}
