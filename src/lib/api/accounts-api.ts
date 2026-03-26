// Hiro API accounts endpoints

export const HIRO_API_BASE = 'https://api.hiro.so';

export const HIRO_TESTNET_BASE = 'https://api.testnet.hiro.so';

export type Network = 'mainnet' | 'testnet';

export type AccountBalance = { stx: StxBalance; fungible_tokens: Record<string, FtBalance>; non_fungible_tokens: Record<string, NftHolding> };
