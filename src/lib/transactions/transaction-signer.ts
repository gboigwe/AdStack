// Stacks Transactions signing utilities

export type PrivateKey = string;

export type PublicKey = string;

export type Signature = string;

export type SignerOptions = { network: 'mainnet' | 'testnet'; fee?: bigint; nonce?: bigint };

export type MultiSigConfig = { requiredSignatures: number; publicKeys: PublicKey[] };

export const COMPRESSED_PUBLIC_KEY_LENGTH = 66;

export const UNCOMPRESSED_PUBLIC_KEY_LENGTH = 130;

export const SIGNATURE_LENGTH = 130;

export function isValidPrivateKey(key: string): boolean {
  return /^[0-9a-fA-F]{64}(01)?$/.test(key);
}

export function isValidPublicKey(key: string): boolean {
  return key.length === COMPRESSED_PUBLIC_KEY_LENGTH || key.length === UNCOMPRESSED_PUBLIC_KEY_LENGTH;
}

export function isValidSignature(sig: string): boolean {
  return sig.length === SIGNATURE_LENGTH && /^[0-9a-fA-F]+$/.test(sig);
}

export function makeMultiSigConfig(publicKeys: PublicKey[], requiredSignatures: number): MultiSigConfig {
  if (requiredSignatures > publicKeys.length) throw new Error('Required signatures exceeds key count');
  return { requiredSignatures, publicKeys };
}
