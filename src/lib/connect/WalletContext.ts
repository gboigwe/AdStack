// Stacks Connect wallet state management

export type WalletState = { connected: boolean; address: string | null; provider: string | null; network: 'mainnet' | 'testnet'; loading: boolean; error: string | null };

export const INITIAL_WALLET_STATE: WalletState = { connected: false, address: null, provider: null, network: 'mainnet', loading: false, error: null };

export type WalletAction = { type: 'CONNECT'; address: string; provider: string } | { type: 'DISCONNECT' } | { type: 'SET_LOADING'; loading: boolean } | { type: 'SET_ERROR'; error: string } | { type: 'SET_NETWORK'; network: 'mainnet' | 'testnet' };
