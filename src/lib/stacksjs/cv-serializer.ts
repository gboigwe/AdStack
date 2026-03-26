// Stacks.js ClarityValue serialization to hex
import type { ClarityValue, UintCV, IntCV, BoolCV, NoneCV, BufferCV, StringAsciiCV, StringUtf8CV } from './clarity-value-factory';

export type SerializedCV = { hex: string; type: string };

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
