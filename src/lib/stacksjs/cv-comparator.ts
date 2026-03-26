// Stacks.js ClarityValue comparison utilities
import type { ClarityValue } from './clarity-value-factory';

export function cvEqual(a: ClarityValue, b: ClarityValue): boolean {
  if (a.type !== b.type) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function cvCompare(a: ClarityValue, b: ClarityValue): -1 | 0 | 1 {
  const aStr = JSON.stringify(a);
  const bStr = JSON.stringify(b);
  if (aStr < bStr) return -1;
  if (aStr > bStr) return 1;
  return 0;
}

export function cvUintEqual(a: ClarityValue, b: ClarityValue): boolean {
  if (a.type !== 'uint' || b.type !== 'uint') return false;
  return (a as { type: 'uint'; value: bigint }).value === (b as { type: 'uint'; value: bigint }).value;
}

export function cvUintGreaterThan(a: ClarityValue, b: ClarityValue): boolean {
  if (a.type !== 'uint' || b.type !== 'uint') return false;
  return (a as { type: 'uint'; value: bigint }).value > (b as { type: 'uint'; value: bigint }).value;
}

export function cvUintLessThan(a: ClarityValue, b: ClarityValue): boolean {
  if (a.type !== 'uint' || b.type !== 'uint') return false;
  return (a as { type: 'uint'; value: bigint }).value < (b as { type: 'uint'; value: bigint }).value;
}

export function cvStringEqual(a: ClarityValue, b: ClarityValue): boolean {
  if (a.type !== b.type) return false;
  if (a.type !== 'string-ascii' && a.type !== 'string-utf8') return false;
  return (a as { type: string; data: string }).data === (b as { type: string; data: string }).data;
}

export function cvBoolEqual(a: ClarityValue, b: ClarityValue): boolean {
  if (a.type !== 'bool' || b.type !== 'bool') return false;
  return (a as { type: 'bool'; value: boolean }).value === (b as { type: 'bool'; value: boolean }).value;
}

export function cvPrincipalEqual(a: ClarityValue, b: ClarityValue): boolean {
  const aIsP = a.type === 'standard_principal' || a.type === 'contract_principal';
  const bIsP = b.type === 'standard_principal' || b.type === 'contract_principal';
  if (!aIsP || !bIsP) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

// Comparator utility 1 - check for specific uint values
export function isUintValue1(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(1);
}

// Comparator utility 2 - check for specific uint values
export function isUintValue2(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(2);
}

// Comparator utility 3 - check for specific uint values
export function isUintValue3(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(3);
}

// Comparator utility 4 - check for specific uint values
export function isUintValue4(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(4);
}

// Comparator utility 5 - check for specific uint values
export function isUintValue5(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(5);
}

// Comparator utility 6 - check for specific uint values
export function isUintValue6(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(6);
}

// Comparator utility 7 - check for specific uint values
export function isUintValue7(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(7);
}

// Comparator utility 8 - check for specific uint values
export function isUintValue8(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(8);
}

// Comparator utility 9 - check for specific uint values
export function isUintValue9(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(9);
}

// Comparator utility 10 - check for specific uint values
export function isUintValue10(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(10);
}

// Comparator utility 11 - check for specific uint values
export function isUintValue11(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(11);
}

// Comparator utility 12 - check for specific uint values
export function isUintValue12(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(12);
}

// Comparator utility 13 - check for specific uint values
export function isUintValue13(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(13);
}

// Comparator utility 14 - check for specific uint values
export function isUintValue14(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(14);
}

// Comparator utility 15 - check for specific uint values
export function isUintValue15(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(15);
}

// Comparator utility 16 - check for specific uint values
export function isUintValue16(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(16);
}

// Comparator utility 17 - check for specific uint values
export function isUintValue17(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(17);
}

// Comparator utility 18 - check for specific uint values
export function isUintValue18(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(18);
}

// Comparator utility 19 - check for specific uint values
export function isUintValue19(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(19);
}

// Comparator utility 20 - check for specific uint values
export function isUintValue20(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(20);
}

// Comparator utility 21 - check for specific uint values
export function isUintValue21(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(21);
}

// Comparator utility 22 - check for specific uint values
export function isUintValue22(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(22);
}

// Comparator utility 23 - check for specific uint values
export function isUintValue23(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(23);
}

// Comparator utility 24 - check for specific uint values
export function isUintValue24(cv: ClarityValue): boolean {
  return cv.type === 'uint' && (cv as { type: 'uint'; value: bigint }).value === BigInt(24);
}
