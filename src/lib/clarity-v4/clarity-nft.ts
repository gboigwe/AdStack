// Clarity v4 NFT Type Helpers

export type NftAsset = { contractId: string; assetName: string; tokenId: bigint };

export type NftMintParams = { recipient: string; tokenId: bigint; metadata?: string };
