// Branded primitives for Stacks types
declare const __brand: unique symbol;
export type Brand<T, B> = T & { [__brand]: B };

export type Uint128 = Brand<bigint, 'Uint128'>;
export type Int128 = Brand<bigint, 'Int128'>;
