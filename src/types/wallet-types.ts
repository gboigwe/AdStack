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

export function isLeatherWallet(w: ConnectedWallet): boolean { return w.type === 'leather'; }
export function isXverseWallet(w: ConnectedWallet): boolean { return w.type === 'xverse'; }
export function isMainnet(account: WalletAccount): boolean { return account.network === 'mainnet'; }
export function getActiveAddress(wallet: ConnectedWallet): string { return wallet.activeAccount.address; }
