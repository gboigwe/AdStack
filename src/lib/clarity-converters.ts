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
export function toUIntCV(value: number | bigint): UIntCV {
  const n = typeof value === 'number' ? BigInt(Math.floor(value)) : value;
  if (n < 0n) throw new RangeError('UInt cannot be negative');
  return { type: 'uint', value: n };
}

/**
 * Create a Clarity int value.
 */
export function toIntCV(value: number | bigint): IntCV {
  const n = typeof value === 'number' ? BigInt(Math.floor(value)) : value;
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
export function toPrincipalCV(address: string): PrincipalCV {
  if (address.includes('.')) {
    const [addr, contractName] = address.split('.', 2);
    return { type: 'principal', value: { address: addr, contractName } };
  }
  return { type: 'principal', value: { address } };
}

/**
 * Create a Clarity list value from an array of Clarity values.
 */
export function toListCV(items: ClarityValue[]): ListCV {
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
