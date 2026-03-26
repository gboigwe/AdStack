// Clarity v4 NFT Type Helpers

export type NftAsset = { contractId: string; assetName: string; tokenId: bigint };

export type NftMintParams = { recipient: string; tokenId: bigint; metadata?: string };

export type NftTransferParams = { tokenId: bigint; sender: string; recipient: string };

export type NftBurnParams = { tokenId: bigint; owner: string };

export function makeNftAsset(contractId: string, assetName: string, tokenId: bigint): NftAsset {
  return { contractId, assetName, tokenId };
}
