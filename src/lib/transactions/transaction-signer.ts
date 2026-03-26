// Stacks Transactions signing utilities

export type PrivateKey = string;

export type PublicKey = string;

export type Signature = string;

export type SignerOptions = { network: 'mainnet' | 'testnet'; fee?: bigint; nonce?: bigint };
