// Wallet connection and authentication types
export type WalletType = 'leather' | 'xverse' | 'asigna' | 'unknown';
export type WalletNetwork = 'mainnet' | 'testnet' | 'devnet';

export interface WalletAccount {
  address: string;
  publicKey: string;
  network: WalletNetwork;
  label?: string;
}

export interface ConnectedWallet {
  type: WalletType;
  accounts: WalletAccount[];
  activeAccount: WalletAccount;
}

export interface WalletConnectionEvent {
  wallet: ConnectedWallet;
  timestamp: number;
}

export interface WalletSignatureResult {
  signature: string;
  publicKey: string;
}
