// Clarity v4 Fungible Token Helpers

export type FtAsset = { contractId: string; assetName: string; decimals: number };

export type FtBalance = { asset: FtAsset; amount: bigint };

export type FtMintParams = { recipient: string; amount: bigint };
export type FtTransferParams = { sender: string; recipient: string; amount: bigint };
export type FtBurnParams = { owner: string; amount: bigint };

export function makeFtAsset(contractId: string, assetName: string, decimals: number): FtAsset {
  return { contractId, assetName, decimals };
}
