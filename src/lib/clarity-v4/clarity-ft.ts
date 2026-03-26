// Clarity v4 Fungible Token Helpers

export type FtAsset = { contractId: string; assetName: string; decimals: number };

export type FtBalance = { asset: FtAsset; amount: bigint };
