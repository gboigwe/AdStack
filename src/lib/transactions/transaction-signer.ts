// Stacks Transactions signing utilities

export type PrivateKey = string;

export type PublicKey = string;

export type Signature = string;

export type SignerOptions = { network: 'mainnet' | 'testnet'; fee?: bigint; nonce?: bigint };

export type MultiSigConfig = { requiredSignatures: number; publicKeys: PublicKey[] };

export const COMPRESSED_PUBLIC_KEY_LENGTH = 66;

export const UNCOMPRESSED_PUBLIC_KEY_LENGTH = 130;
