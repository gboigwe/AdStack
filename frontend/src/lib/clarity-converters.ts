/**
 * Clarity v4 Value Converters
 * Utilities to convert between JavaScript and Clarity v4 types
 */

import {
  uintCV,
  intCV,
  boolCV,
  bufferCV,
  stringAsciiCV,
  stringUtf8CV,
  principalCV,
  listCV,
  tupleCV,
  responseOkCV,
  responseErrorCV,
  someCV,
  noneCV,
  contractPrincipalCV,
  standardPrincipalCV,
  ClarityValue,
  cvToValue,
  cvToString,
} from '@stacks/transactions';

/**
 * Convert stacks-block-time (Unix timestamp) to JavaScript Date
 */
export function stacksBlockTimeToDate(blockTime: bigint | number): Date {
  const timestamp = typeof blockTime === 'bigint' ? Number(blockTime) : blockTime;
  return new Date(timestamp * 1000); // Convert seconds to milliseconds
}

/**
 * Convert JavaScript Date to stacks-block-time (Unix timestamp in seconds)
 */
export function dateToStacksBlockTime(date: Date): bigint {
  return BigInt(Math.floor(date.getTime() / 1000));
}

/**
 * Convert JavaScript number to Clarity uint
 */
export function toUIntCV(value: number | bigint | string): ClarityValue {
  return uintCV(BigInt(value));
}

/**
 * Convert JavaScript number to Clarity int
 */
export function toIntCV(value: number | bigint | string): ClarityValue {
  return intCV(BigInt(value));
}

/**
 * Convert JavaScript boolean to Clarity bool
 */
export function toBoolCV(value: boolean): ClarityValue {
  return boolCV(value);
}

/**
 * Convert JavaScript string to Clarity string-ascii
 */
export function toStringAsciiCV(value: string): ClarityValue {
  return stringAsciiCV(value);
}

/**
 * Convert JavaScript string to Clarity string-utf8
 */
export function toStringUtf8CV(value: string): ClarityValue {
  return stringUtf8CV(value);
}

/**
 * Convert Stacks address to Clarity principal
 */
export function toPrincipalCV(address: string, contractName?: string): ClarityValue {
  if (contractName) {
    return contractPrincipalCV(address, contractName);
  }
  return standardPrincipalCV(address);
}

/**
 * Convert JavaScript array to Clarity list
 */
export function toListCV(values: ClarityValue[]): ClarityValue {
  return listCV(values);
}

/**
 * Convert JavaScript object to Clarity tuple
 */
export function toTupleCV(data: Record<string, ClarityValue>): ClarityValue {
  return tupleCV(data);
}

/**
 * Convert to Clarity response-ok
 */
export function toResponseOkCV(value: ClarityValue): ClarityValue {
  return responseOkCV(value);
}

/**
 * Convert to Clarity response-error
 */
export function toResponseErrorCV(value: ClarityValue): ClarityValue {
  return responseErrorCV(value);
}

/**
 * Convert to Clarity optional (some)
 */
export function toSomeCV(value: ClarityValue): ClarityValue {
  return someCV(value);
}

/**
 * Convert to Clarity optional (none)
 */
export function toNoneCV(): ClarityValue {
  return noneCV();
}

/**
 * Extract value from Clarity response
 */
export function extractResponseValue<T = any>(response: ClarityValue): T {
  const value = cvToValue(response);
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return value.value as T;
  }
  return value as T;
}

/**
 * Parse Clarity uint to JavaScript number
 */
export function parseUInt(cv: ClarityValue): number {
  const value = cvToValue(cv);
  return typeof value === 'bigint' ? Number(value) : Number(value);
}

/**
 * Parse Clarity int to JavaScript number
 */
export function parseInt(cv: ClarityValue): number {
  const value = cvToValue(cv);
  return typeof value === 'bigint' ? Number(value) : Number(value);
}

/**
 * Parse Clarity bool to JavaScript boolean
 */
export function parseBool(cv: ClarityValue): boolean {
  return cvToValue(cv) as boolean;
}

/**
 * Parse Clarity string to JavaScript string
 */
export function parseString(cv: ClarityValue): string {
  return cvToValue(cv) as string;
}

/**
 * Parse Clarity principal to JavaScript string (address)
 */
export function parsePrincipal(cv: ClarityValue): string {
  return cvToString(cv);
}

/**
 * Parse Clarity tuple to JavaScript object
 */
export function parseTuple<T = Record<string, any>>(cv: ClarityValue): T {
  return cvToValue(cv) as T;
}

/**
 * Parse Clarity list to JavaScript array
 */
export function parseList<T = any>(cv: ClarityValue): T[] {
  const value = cvToValue(cv);
  return Array.isArray(value) ? value : [];
}

/**
 * Parse Clarity optional
 */
export function parseOptional<T = any>(cv: ClarityValue): T | null {
  const value = cvToValue(cv);
  return value === null ? null : (value as T);
}

/**
 * Parse Clarity response (ok/err)
 */
export function parseResponse<T = any>(cv: ClarityValue): {
  success: boolean;
  value: T;
} {
  const response = cvToValue(cv) as any;
  if (typeof response === 'object' && 'value' in response) {
    return {
      success: response.success ?? true,
      value: response.value as T,
    };
  }
  return {
    success: true,
    value: response as T,
  };
}

/**
 * Micro-STX conversion
 */
export const MICRO_STX = 1_000_000;

export function microStxToStx(microStx: bigint | number): number {
  return Number(microStx) / MICRO_STX;
}

export function stxToMicroStx(stx: number): bigint {
  return BigInt(Math.floor(stx * MICRO_STX));
}
