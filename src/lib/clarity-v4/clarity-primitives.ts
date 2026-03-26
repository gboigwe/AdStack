// Clarity v4 Primitive Types and Validators

export type ClarityUint = { type: 'uint'; value: bigint };

export type ClarityInt = { type: 'int'; value: bigint };

export type ClarityBool = { type: 'bool'; value: boolean };

export type ClarityPrincipal = { type: 'principal'; value: string };

export type ClarityOptional<T> = { type: 'optional'; value: T | null };

export type ClarityNone = { type: 'none' };

export type ClaritySome<T> = { type: 'some'; value: T };

export type ClarityResponseOk<T> = { type: 'ok'; value: T };

export type ClarityResponseErr<E> = { type: 'err'; value: E };

export type ClarityResponse<T, E> = ClarityResponseOk<T> | ClarityResponseErr<E>;

export type ClarityBuffer = { type: 'buffer'; value: Uint8Array };

export type ClarityStringAscii = { type: 'string-ascii'; value: string };

export type ClarityStringUtf8 = { type: 'string-utf8'; value: string };

export const MAX_UINT128 = BigInt('340282366920938463463374607431768211455');

export const MIN_INT128 = BigInt('-170141183460469231731687303715884105728');

export const MAX_INT128 = BigInt('170141183460469231731687303715884105727');

export const ZERO_UINT: ClarityUint = { type: 'uint', value: BigInt(0) };

export const ZERO_INT: ClarityInt = { type: 'int', value: BigInt(0) };

export const TRUE_BOOL: ClarityBool = { type: 'bool', value: true };
export const FALSE_BOOL: ClarityBool = { type: 'bool', value: false };

/** Create a Clarity uint value */
export function makeUint(value: bigint | number): ClarityUint {
  const v = BigInt(value);
  if (v < BigInt(0)) throw new RangeError('uint must be non-negative');
  if (v > MAX_UINT128) throw new RangeError('uint exceeds max uint128');
  return { type: 'uint', value: v };
}

/** Create a Clarity int value */
export function makeInt(value: bigint | number): ClarityInt {
  const v = BigInt(value);
  if (v < MIN_INT128) throw new RangeError('int below min int128');
  if (v > MAX_INT128) throw new RangeError('int exceeds max int128');
  return { type: 'int', value: v };
}

/** Create a Clarity bool value */
export function makeBool(value: boolean): ClarityBool {
  return { type: 'bool', value };
}

/** Validate a Stacks principal address */
export function isValidPrincipal(address: string): boolean {
  if (!address) return false;
  const contractRegex = /^(SP|ST)[A-Z0-9]{1,40}\.[a-zA-Z0-9_-]{1,128}$/;
  const standardRegex = /^(SP|ST)[A-Z0-9]{33,39}$/;
  return contractRegex.test(address) || standardRegex.test(address);
}

/** Create a Clarity principal value */
export function makePrincipal(address: string): ClarityPrincipal {
  if (!isValidPrincipal(address)) throw new Error(`Invalid principal: ${address}`);
  return { type: 'principal', value: address };
}

/** Create a Clarity some value */
export function makeSome<T>(value: T): ClaritySome<T> {
  return { type: 'some', value };
}

/** Create a Clarity none value */
export function makeNone(): ClarityNone {
  return { type: 'none' };
}
