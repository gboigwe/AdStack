// Branded primitives for Stacks types
declare const __brand: unique symbol;
export type Brand<T, B> = T & { [__brand]: B };

export type Uint128 = Brand<bigint, 'Uint128'>;
export type Int128 = Brand<bigint, 'Int128'>;

export type TxId = Brand<string, 'TxId'>;
export type BlockHash = Brand<string, 'BlockHash'>;
export type BurnBlockHash = Brand<string, 'BurnBlockHash'>;

export type StxAddress = Brand<string, 'StxAddress'>;
export type ContractAddress = Brand<string, 'ContractAddress'>;
export type ContractName = Brand<string, 'ContractName'>;

export type MicroStx = Brand<bigint, 'MicroStx'>;
export type Stx = Brand<number, 'Stx'>;

export type BlockHeight = Brand<number, 'BlockHeight'>;
export type BurnBlockHeight = Brand<number, 'BurnBlockHeight'>;
export type Nonce = Brand<number, 'Nonce'>;

export type HexString = Brand<string, 'HexString'>;
export type Bytes = Brand<Uint8Array, 'Bytes'>;

export function asUint128(n: bigint): Uint128 { return n as Uint128; }
export function asInt128(n: bigint): Int128 { return n as Int128; }
export function asTxId(s: string): TxId { return s as TxId; }
export function asBlockHash(s: string): BlockHash { return s as BlockHash; }
export function asStxAddress(s: string): StxAddress { return s as StxAddress; }
export function asMicroStx(n: bigint): MicroStx { return n as MicroStx; }
export function asBlockHeight(n: number): BlockHeight { return n as BlockHeight; }
export function asHexString(s: string): HexString { return s as HexString; }

export const MAX_UINT128 = 340282366920938463463374607431768211455n as Uint128;
export const MIN_INT128 = -170141183460469231731687303715884105728n as Int128;
export const MAX_INT128 = 170141183460469231731687303715884105727n as Int128;

export function isUint128Safe(n: bigint): n is Uint128 {
  return n >= 0n && n <= MAX_UINT128;
}
export function isInt128Safe(n: bigint): n is Int128 {
  return n >= MIN_INT128 && n <= MAX_INT128;
}
