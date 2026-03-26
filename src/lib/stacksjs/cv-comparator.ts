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
