// Clarity v4 Serialization Helpers

export type SerializedClarity = { hex: string; type: string };

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const result = new Uint8Array(clean.length / 2);
  for (let i = 0; i < result.length; i++) {
    result[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return result;
}

export function serializeUint(value: bigint): string {
  const buf = new ArrayBuffer(16);
  const view = new DataView(buf);
  const high = value >> BigInt(64);
  const low = value & BigInt('0xFFFFFFFFFFFFFFFF');
  view.setBigUint64(0, high);
  view.setBigUint64(8, low);
  return bytesToHex(new Uint8Array(buf));
}

export function deserializeUint(hex: string): bigint {
  const bytes = hexToBytes(hex.slice(0, 32));
  const view = new DataView(bytes.buffer);
  const high = view.getBigUint64(0);
  const low = view.getBigUint64(8);
  return (high << BigInt(64)) | low;
}

export function encodeBoolCV(value: boolean): string {
  return value ? '03' : '04';
}

export function encodeNoneCV(): string {
  return '09';
}

export function validateHexString(hex: string): boolean {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  return /^[0-9a-fA-F]*$/.test(clean) && clean.length % 2 === 0;
}

export function padHexTo32Bytes(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  return clean.padStart(64, '0');
}

export function concatHex(...hexStrings: string[]): string {
  return hexStrings.map(h => h.startsWith('0x') ? h.slice(2) : h).join('');
}
