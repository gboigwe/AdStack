// Stacks Transactions SDK builder patterns

export type TransactionVersion = 0 | 1;

export const MAINNET_VERSION: TransactionVersion = 0;

export const TESTNET_VERSION: TransactionVersion = 1;

export type TransactionType = 'token_transfer' | 'contract_call' | 'smart_contract' | 'coinbase';

export type TransactionPayload = TokenTransferPayload | ContractCallPayload;

export type TokenTransferPayload = { type: 'token_transfer'; recipient: string; amount: bigint; memo: string };
