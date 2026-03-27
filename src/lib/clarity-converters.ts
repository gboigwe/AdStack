/**
 * Clarity Value Converters
 * Helpers for converting between TypeScript and Clarity values.
 * Used when building contract call arguments.
 */

import type {
  UIntCV,
  IntCV,
  BoolCV,
  StringAsciiCV,
  StringUtf8CV,
  PrincipalCV,
  ListCV,
  OptionalCV,
  ClarityValue,
} from '@/types/clarity-v4';

/**
 * Create a Clarity uint value.
 * @param value - Non-negative integer or bigint
 */
const UINT128_MAX = (1n << 128n) - 1n;

export function toUIntCV(value: number | bigint): UIntCV {
  const n = typeof value === 'number' ? BigInt(Math.floor(value)) : value;
  if (n < 0n) throw new RangeError('UInt cannot be negative');
  if (n > UINT128_MAX) throw new RangeError(`UInt value ${n} exceeds uint128 max (${UINT128_MAX})`);
  return { type: 'uint', value: n };
}

/**
 * Create a Clarity int value.
 */
const INT128_MIN = -(1n << 127n);
const INT128_MAX = (1n << 127n) - 1n;

export function toIntCV(value: number | bigint): IntCV {
  const n = typeof value === 'number' ? BigInt(Math.floor(value)) : value;
  if (n < INT128_MIN || n > INT128_MAX) {
    throw new RangeError(`Int value ${n} is outside int128 range [${INT128_MIN}, ${INT128_MAX}]`);
  }
  return { type: 'int', value: n };
}

/**
 * Create a Clarity bool value.
 */
export function toBoolCV(value: boolean): BoolCV {
  return { type: 'bool', value };
}

/**
 * Create a Clarity string-ascii value.
 * Validates that the string only contains ASCII characters.
 */
export function toStringAsciiCV(value: string): StringAsciiCV {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 127) {
      throw new RangeError(`Non-ASCII character at position ${i}: "${value[i]}"`);
    }
  }
  return { type: 'string-ascii', value };
}

/**
 * Create a Clarity string-utf8 value.
 */
export function toStringUtf8CV(value: string): StringUtf8CV {
  return { type: 'string-utf8', value };
}

/**
 * Create a Clarity principal value from an address string.
 * Supports both standard principals (SP...) and contract principals (SP...contract-name).
 */
const PRINCIPAL_PATTERN = /^S[PM][A-Z0-9]{1,38}$/;
const CONTRACT_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{0,127}$/;

export function toPrincipalCV(address: string): PrincipalCV {
  if (!address || address.length === 0) {
    throw new Error('toPrincipalCV: address is required');
  }

  if (address.includes('.')) {
    const parts = address.split('.', 2);
    const addr = parts[0] ?? '';
    const contractName = parts[1] ?? '';

    if (!PRINCIPAL_PATTERN.test(addr)) {
      throw new Error(`toPrincipalCV: invalid standard principal format: ${addr}`);
    }
    if (!CONTRACT_NAME_PATTERN.test(contractName)) {
      throw new Error(`toPrincipalCV: invalid contract name format: ${contractName}`);
    }

    return { type: 'principal', value: { address: addr, contractName } };
  }

  if (!PRINCIPAL_PATTERN.test(address)) {
    throw new Error(`toPrincipalCV: invalid principal format: ${address}`);
  }

  return { type: 'principal', value: { address } };
}

/**
 * Create a Clarity list value from an array of Clarity values.
 */
const MAX_CLARITY_LIST_SIZE = 2000;

export function toListCV(items: ClarityValue[]): ListCV {
  if (items.length > MAX_CLARITY_LIST_SIZE) {
    throw new RangeError(`List size ${items.length} exceeds Clarity maximum of ${MAX_CLARITY_LIST_SIZE}`);
  }
  return { type: 'list', value: items };
}

/**
 * Create a Clarity optional-some value.
 */
export function toSomeCV(value: ClarityValue): OptionalCV {
  return { type: 'optional', value };
}

/**
 * Create a Clarity optional-none value.
 */
export function toNoneCV(): OptionalCV {
  return { type: 'optional', value: null };
}

/**
 * Extract a number from a Clarity uint or int value.
 * Throws if the value exceeds Number.MAX_SAFE_INTEGER.
 */
export function cvToNumber(cv: UIntCV | IntCV): number {
  const n = Number(cv.value);
  if (!Number.isSafeInteger(n)) {
    throw new RangeError(`Value ${cv.value} exceeds safe integer range`);
  }
  return n;
}

/**
 * Extract a bigint from a Clarity uint or int value.
 */
export function cvToBigInt(cv: UIntCV | IntCV): bigint {
  return cv.value;
}

/**
 * Extract a string from a Clarity string value.
 */
export function cvToString(cv: StringAsciiCV | StringUtf8CV): string {
  return cv.value;
}

/**
 * Extract the address from a Clarity principal value.
 */
export function cvToAddress(cv: PrincipalCV): string {
  const { address, contractName } = cv.value;
  return contractName ? `${address}.${contractName}` : address;
}

/**
 * Convert a Unix timestamp (seconds) from stacks-block-time to a Date.
 */
export function stacksBlockTimeToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Convert a Date to stacks-block-time format (Unix seconds).
 */
export function dateToStacksBlockTime(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}
