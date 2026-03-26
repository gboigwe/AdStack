// Stacks Connect wallet state management

export type WalletState = { connected: boolean; address: string | null; provider: string | null; network: 'mainnet' | 'testnet'; loading: boolean; error: string | null };

export const INITIAL_WALLET_STATE: WalletState = { connected: false, address: null, provider: null, network: 'mainnet', loading: false, error: null };

export type WalletAction = { type: 'CONNECT'; address: string; provider: string } | { type: 'DISCONNECT' } | { type: 'SET_LOADING'; loading: boolean } | { type: 'SET_ERROR'; error: string } | { type: 'SET_NETWORK'; network: 'mainnet' | 'testnet' };

export function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'CONNECT':
      return { ...state, connected: true, address: action.address, provider: action.provider, loading: false, error: null };
    case 'DISCONNECT':
      return { ...INITIAL_WALLET_STATE };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    case 'SET_NETWORK':
      return { ...state, network: action.network };
    default:
      return state;
  }
}

export function isWalletConnected(state: WalletState): boolean {
  return state.connected && state.address !== null;
}

export function getWalletAddress(state: WalletState): string | null {
  return state.connected ? state.address : null;
}

export function getWalletNetwork(state: WalletState): 'mainnet' | 'testnet' {
  return state.network;
}

export function createConnectAction(address: string, provider: string): WalletAction {
  return { type: 'CONNECT', address, provider };
}

export function createDisconnectAction(): WalletAction {
  return { type: 'DISCONNECT' };
}

export function createSetNetworkAction(network: 'mainnet' | 'testnet'): WalletAction {
  return { type: 'SET_NETWORK', network };
}

export function createSetErrorAction(error: string): WalletAction {
  return { type: 'SET_ERROR', error };
}
