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
