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

export function detectInstalledWallets(): WalletInfo[] {
  const wallets: WalletInfo[] = [];
  if (isLeatherInstalled()) wallets.push({ id: 'leather', name: 'Leather', icon: '/leather.svg', installed: true });
  if (isXverseInstalled()) wallets.push({ id: 'xverse', name: 'Xverse', icon: '/xverse.svg', installed: true });
  if (isAsignaInstalled()) wallets.push({ id: 'asigna', name: 'Asigna', icon: '/asigna.svg', installed: true });
  return wallets;
}

export function getPreferredWallet(): WalletProvider {
  const installed = detectInstalledWallets();
  return installed.length > 0 ? installed[0].id : 'unknown';
}

export function hasAnyWalletInstalled(): boolean {
  return detectInstalledWallets().length > 0;
}

export const WALLET_PROVIDER_VERSION_1 = '1';

export const WALLET_PROVIDER_VERSION_2 = '2';

export const WALLET_PROVIDER_VERSION_3 = '3';

export const WALLET_PROVIDER_VERSION_4 = '4';

export const WALLET_PROVIDER_VERSION_5 = '5';

export const WALLET_PROVIDER_VERSION_6 = '6';

export const WALLET_PROVIDER_VERSION_7 = '7';

export const WALLET_PROVIDER_VERSION_8 = '8';

export const WALLET_PROVIDER_VERSION_9 = '9';

export const WALLET_PROVIDER_VERSION_10 = '10';

export const WALLET_PROVIDER_VERSION_11 = '11';

export const WALLET_PROVIDER_VERSION_12 = '12';

export const WALLET_PROVIDER_VERSION_13 = '13';

export const WALLET_PROVIDER_VERSION_14 = '14';

export const WALLET_PROVIDER_VERSION_15 = '15';

export const WALLET_PROVIDER_VERSION_16 = '16';

export const WALLET_PROVIDER_VERSION_17 = '17';

export const WALLET_PROVIDER_VERSION_18 = '18';

export const WALLET_PROVIDER_VERSION_19 = '19';

export const WALLET_PROVIDER_VERSION_20 = '20';

export const WALLET_PROVIDER_VERSION_21 = '21';

export const WALLET_PROVIDER_VERSION_22 = '22';

export const WALLET_PROVIDER_VERSION_23 = '23';

export const WALLET_PROVIDER_VERSION_24 = '24';

export const WALLET_PROVIDER_VERSION_25 = '25';

export const WALLET_PROVIDER_VERSION_26 = '26';

export const WALLET_PROVIDER_VERSION_27 = '27';

export const WALLET_PROVIDER_VERSION_28 = '28';

export const WALLET_PROVIDER_VERSION_29 = '29';

export const WALLET_PROVIDER_VERSION_30 = '30';

export const WALLET_PROVIDER_VERSION_31 = '31';

export const WALLET_PROVIDER_VERSION_32 = '32';

export const WALLET_PROVIDER_VERSION_33 = '33';

export const WALLET_PROVIDER_VERSION_34 = '34';

export const WALLET_PROVIDER_VERSION_35 = '35';

export const WALLET_PROVIDER_VERSION_36 = '36';

export const WALLET_PROVIDER_VERSION_37 = '37';

export const WALLET_PROVIDER_VERSION_38 = '38';

export const WALLET_PROVIDER_VERSION_39 = '39';

export const WALLET_PROVIDER_VERSION_40 = '40';

export const WALLET_PROVIDER_VERSION_41 = '41';

export const WALLET_PROVIDER_VERSION_42 = '42';

export const WALLET_PROVIDER_VERSION_43 = '43';

export const WALLET_PROVIDER_VERSION_44 = '44';

export const WALLET_PROVIDER_VERSION_45 = '45';

export const WALLET_PROVIDER_VERSION_46 = '46';

export const WALLET_PROVIDER_VERSION_47 = '47';

export const WALLET_PROVIDER_VERSION_48 = '48';

export const WALLET_PROVIDER_VERSION_49 = '49';

export const WALLET_PROVIDER_VERSION_50 = '50';

export const WALLET_PROVIDER_VERSION_51 = '51';

export const WALLET_PROVIDER_VERSION_52 = '52';

export const WALLET_PROVIDER_VERSION_53 = '53';

export const WALLET_PROVIDER_VERSION_54 = '54';

export const WALLET_PROVIDER_VERSION_55 = '55';

export const WALLET_PROVIDER_VERSION_56 = '56';

export const WALLET_PROVIDER_VERSION_57 = '57';

export const WALLET_PROVIDER_VERSION_58 = '58';

export const WALLET_PROVIDER_VERSION_59 = '59';

export const WALLET_PROVIDER_VERSION_60 = '60';

export const WALLET_PROVIDER_VERSION_61 = '61';

export const WALLET_PROVIDER_VERSION_62 = '62';

export const WALLET_PROVIDER_VERSION_63 = '63';

export const WALLET_PROVIDER_VERSION_64 = '64';

export const WALLET_PROVIDER_VERSION_65 = '65';

export const WALLET_PROVIDER_VERSION_66 = '66';

export const WALLET_PROVIDER_VERSION_67 = '67';

export const WALLET_PROVIDER_VERSION_68 = '68';
