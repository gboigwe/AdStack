// Stacks wallet provider detection utilities

export type WalletProvider = 'leather' | 'xverse' | 'asigna' | 'unknown';

export type WalletInfo = { id: WalletProvider; name: string; icon: string; installed: boolean };

export const LEATHER_PROVIDER_KEY = 'LeatherProvider';

export const XVERSE_PROVIDER_KEY = 'XverseProviders';

export const ASIGNA_PROVIDER_KEY = 'AsignaProvider';

export function isLeatherInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as Record<string, unknown>)[LEATHER_PROVIDER_KEY];
}

export function isXverseInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as Record<string, unknown>)[XVERSE_PROVIDER_KEY];
}

export function isAsignaInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as Record<string, unknown>)[ASIGNA_PROVIDER_KEY];
}
