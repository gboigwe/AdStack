// Clarity v4 Fungible Token Helpers

export type FtAsset = { contractId: string; assetName: string; decimals: number };

export type FtBalance = { asset: FtAsset; amount: bigint };

export type FtMintParams = { recipient: string; amount: bigint };
export type FtTransferParams = { sender: string; recipient: string; amount: bigint };
export type FtBurnParams = { owner: string; amount: bigint };

export function makeFtAsset(contractId: string, assetName: string, decimals: number): FtAsset {
  return { contractId, assetName, decimals };
}

export function ftAmountToDisplay(amount: bigint, decimals: number): string {
  if (decimals === 0) return amount.toString();
  const factor = BigInt(10 ** decimals);
  const whole = amount / factor;
  const frac = amount % factor;
  return `${whole}.${frac.toString().padStart(decimals, '0')}`;
}

export function ftDisplayToAmount(display: string, decimals: number): bigint {
  const parts = display.split('.');
  const whole = BigInt(parts[0] ?? '0');
  const fracStr = (parts[1] ?? '').padEnd(decimals, '0').slice(0, decimals);
  return whole * BigInt(10 ** decimals) + BigInt(fracStr);
}
