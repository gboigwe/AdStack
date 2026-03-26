// Stacks.js ClarityValue comparison utilities
import type { ClarityValue } from './clarity-value-factory';

export function cvEqual(a: ClarityValue, b: ClarityValue): boolean {
  if (a.type !== b.type) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}
