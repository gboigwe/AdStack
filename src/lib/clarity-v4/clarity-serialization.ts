// Clarity v4 Serialization Helpers

export type SerializedClarity = { hex: string; type: string };

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
