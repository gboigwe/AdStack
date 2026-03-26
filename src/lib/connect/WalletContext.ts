// Stacks Connect wallet state management

export type WalletState = { connected: boolean; address: string | null; provider: string | null; network: 'mainnet' | 'testnet'; loading: boolean; error: string | null };
