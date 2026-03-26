// Stacks.js ClarityValue serialization to hex
import type { ClarityValue, UintCV, IntCV, BoolCV, NoneCV, BufferCV, StringAsciiCV, StringUtf8CV } from './clarity-value-factory';

export type SerializedCV = { hex: string; type: string };

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function bigIntToBytes16(n: bigint): Uint8Array {
  const bytes = new Uint8Array(16);
  let val = n;
  for (let i = 15; i >= 0; i--) {
    bytes[i] = Number(val & BigInt(0xff));
    val >>= BigInt(8);
  }
  return bytes;
}

export function serializeUintCV(cv: UintCV): string {
  return '01' + bytesToHex(bigIntToBytes16(cv.value));
}

export function serializeIntCV(cv: IntCV): string {
  const twosComplement = cv.value < BigInt(0)
    ? BigInt('340282366920938463463374607431768211456') + cv.value
    : cv.value;
  return '00' + bytesToHex(bigIntToBytes16(twosComplement));
}

export function serializeBoolCV(cv: BoolCV): string {
  return cv.value ? '03' : '04';
}

export function serializeNoneCV(): string {
  return '09';
}

export function serializeBufferCV(cv: BufferCV): string {
  const lengthHex = cv.buffer.length.toString(16).padStart(8, '0');
  return '02' + lengthHex + bytesToHex(cv.buffer);
}

export function serializeStringAsciiCV(cv: StringAsciiCV): string {
  const bytes = new TextEncoder().encode(cv.data);
  const lengthHex = bytes.length.toString(16).padStart(8, '0');
  return '0d' + lengthHex + bytesToHex(bytes);
}

export function serializeStringUtf8CV(cv: { type: 'string-utf8'; data: string }): string {
  const bytes = new TextEncoder().encode(cv.data);
  const lengthHex = bytes.length.toString(16).padStart(8, '0');
  return '0e' + lengthHex + bytesToHex(bytes);
}

export function serializeClarityValue(cv: ClarityValue): string {
  switch (cv.type) {
    case 'uint': return serializeUintCV(cv as UintCV);
    case 'int': return serializeIntCV(cv as IntCV);
    case 'bool': return serializeBoolCV(cv as BoolCV);
    case 'none': return serializeNoneCV();
    case 'buffer': return serializeBufferCV(cv as BufferCV);
    case 'string-ascii': return serializeStringAsciiCV(cv as StringAsciiCV);
    case 'string-utf8': return serializeStringUtf8CV(cv as { type: 'string-utf8'; data: string });
    default: return '';
  }
}

export function cvToHex(cv: ClarityValue): string {
  return '0x' + serializeClarityValue(cv);
}

export function serializeListCV(items: ClarityValue[]): string {
  const lengthHex = items.length.toString(16).padStart(8, '0');
  const serialized = items.map(serializeClarityValue).join('');
  return '0b' + lengthHex + serialized;
}
