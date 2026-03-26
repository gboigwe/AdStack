// Stacks Transactions SDK builder patterns

export type TransactionVersion = 0 | 1;

export const MAINNET_VERSION: TransactionVersion = 0;

export const TESTNET_VERSION: TransactionVersion = 1;

export type TransactionType = 'token_transfer' | 'contract_call' | 'smart_contract' | 'coinbase';

export type TransactionPayload = TokenTransferPayload | ContractCallPayload;

export type TokenTransferPayload = { type: 'token_transfer'; recipient: string; amount: bigint; memo: string };

export type ContractCallPayload = { type: 'contract_call'; contractAddress: string; contractName: string; functionName: string; functionArgs: unknown[] };

export type UnsignedTransaction = { version: TransactionVersion; chainId: number; payload: TransactionPayload; nonce: bigint; fee: bigint; postConditions: unknown[] };

export type SignedTransaction = UnsignedTransaction & { auth: TransactionAuth };
