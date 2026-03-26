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
