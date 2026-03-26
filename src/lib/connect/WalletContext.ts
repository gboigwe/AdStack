// Stacks Connect wallet state management

export type WalletState = { connected: boolean; address: string | null; provider: string | null; network: 'mainnet' | 'testnet'; loading: boolean; error: string | null };

export const INITIAL_WALLET_STATE: WalletState = { connected: false, address: null, provider: null, network: 'mainnet', loading: false, error: null };
