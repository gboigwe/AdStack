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

/** Create a Clarity optional from a nullable value */
export function makeOptional<T>(value: T | null): ClarityOptional<T> {
  return { type: 'optional', value };
}

/** Check if a ClarityUint is zero */
export function isZeroUint(v: ClarityUint): boolean {
  return v.value === BigInt(0);
}

/** Check if a ClarityInt is negative */
export function isNegativeInt(v: ClarityInt): boolean {
  return v.value < BigInt(0);
}

/** Add two ClarityUint values */
export function addUint(a: ClarityUint, b: ClarityUint): ClarityUint {
  return makeUint(a.value + b.value);
}

/** Subtract two ClarityUint values */
export function subUint(a: ClarityUint, b: ClarityUint): ClarityUint {
  if (b.value > a.value) throw new RangeError('uint subtraction underflow');
  return makeUint(a.value - b.value);
}

/** Multiply two ClarityUint values */
export function mulUint(a: ClarityUint, b: ClarityUint): ClarityUint {
  return makeUint(a.value * b.value);
}

/** Divide two ClarityUint values */
export function divUint(a: ClarityUint, b: ClarityUint): ClarityUint {
  if (b.value === BigInt(0)) throw new Error('Division by zero');
  return makeUint(a.value / b.value);
}

/** Modulo of two ClarityUint values */
export function modUint(a: ClarityUint, b: ClarityUint): ClarityUint {
  if (b.value === BigInt(0)) throw new Error('Modulo by zero');
  return makeUint(a.value % b.value);
}

/** Compare two ClarityUint values, returns -1, 0, or 1 */
export function compareUint(a: ClarityUint, b: ClarityUint): -1 | 0 | 1 {
  if (a.value < b.value) return -1;
  if (a.value > b.value) return 1;
  return 0;
}

/** Convert ClarityUint to JS number */
export function uintToNumber(v: ClarityUint): number {
  return Number(v.value);
}

/** Convert ClarityUint to string */
export function uintToString(v: ClarityUint): string {
  return v.value.toString();
}

/** Create a Clarity buffer from a hex string */
export function makeBufferFromHex(hex: string): ClarityBuffer {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return { type: 'buffer', value: bytes };
}

/** Create a Clarity string-ascii value */
export function makeStringAscii(value: string): ClarityStringAscii {
  if (!/^[\x00-\x7F]*$/.test(value)) throw new Error('String contains non-ASCII characters');
  return { type: 'string-ascii', value };
}

/** Create a Clarity string-utf8 value */
export function makeStringUtf8(value: string): ClarityStringUtf8 {
  return { type: 'string-utf8', value };
}

/** Guard: check if value is ClarityUint */
export function isClarityUint(v: unknown): v is ClarityUint {
  return typeof v === 'object' && v !== null && (v as ClarityUint).type === 'uint';
}

/** Guard: check if value is ClarityInt */
export function isClarityInt(v: unknown): v is ClarityInt {
  return typeof v === 'object' && v !== null && (v as ClarityInt).type === 'int';
}

/** Guard: check if value is ClarityBool */
export function isClarityBool(v: unknown): v is ClarityBool {
  return typeof v === 'object' && v !== null && (v as ClarityBool).type === 'bool';
}

/** Guard: check if value is ClarityPrincipal */
export function isClarityPrincipal(v: unknown): v is ClarityPrincipal {
  return typeof v === 'object' && v !== null && (v as ClarityPrincipal).type === 'principal';
}

/** Guard: check if value is ClarityNone */
export function isClarityNone(v: unknown): v is ClarityNone {
  return typeof v === 'object' && v !== null && (v as ClarityNone).type === 'none';
}

/** Guard: check if value is ClaritySome */
export function isClaritySome<T>(v: unknown): v is ClaritySome<T> {
  return typeof v === 'object' && v !== null && (v as ClaritySome<T>).type === 'some';
}

/** Returns whether two ClarityUint values are equal */
export function equalUint(a: ClarityUint, b: ClarityUint): boolean {
  return a.value === b.value;
}

/** Returns whether a ClarityBool value is true */
export function isTrue(b: ClarityBool): boolean {
  return b.value === true;
}

/** Create a ClarityUint from a string representation */
export function makeUintFromString(s: string): ClarityUint {
  return makeUint(BigInt(s));
}

/** Create a ClarityInt from a string representation */
export function makeIntFromString(s: string): ClarityInt {
  return makeInt(BigInt(s));
}
