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

export const WALLET_PROVIDER_VERSION_69 = '69';

export const WALLET_PROVIDER_VERSION_70 = '70';

export const WALLET_PROVIDER_VERSION_71 = '71';

export const WALLET_PROVIDER_VERSION_72 = '72';

export const WALLET_PROVIDER_VERSION_73 = '73';

export const WALLET_PROVIDER_VERSION_74 = '74';

export const WALLET_PROVIDER_VERSION_75 = '75';

export const WALLET_PROVIDER_VERSION_76 = '76';

export const WALLET_PROVIDER_VERSION_77 = '77';

export const WALLET_PROVIDER_VERSION_78 = '78';

export const WALLET_PROVIDER_VERSION_79 = '79';

export const WALLET_PROVIDER_VERSION_80 = '80';

export const WALLET_PROVIDER_VERSION_81 = '81';

export const WALLET_PROVIDER_VERSION_82 = '82';

export const WALLET_PROVIDER_VERSION_83 = '83';

export const WALLET_PROVIDER_VERSION_84 = '84';

export const WALLET_PROVIDER_VERSION_85 = '85';

export const WALLET_PROVIDER_VERSION_86 = '86';

export const WALLET_PROVIDER_VERSION_87 = '87';

export const WALLET_PROVIDER_VERSION_88 = '88';

export const WALLET_PROVIDER_VERSION_89 = '89';

export const WALLET_PROVIDER_VERSION_90 = '90';

export const WALLET_PROVIDER_VERSION_91 = '91';

export const WALLET_PROVIDER_VERSION_92 = '92';

export const WALLET_PROVIDER_VERSION_93 = '93';

export const WALLET_PROVIDER_VERSION_94 = '94';

export const WALLET_PROVIDER_VERSION_95 = '95';

export const WALLET_PROVIDER_VERSION_96 = '96';

export const WALLET_PROVIDER_VERSION_97 = '97';

export const WALLET_PROVIDER_VERSION_98 = '98';

export const WALLET_PROVIDER_VERSION_99 = '99';

export const WALLET_PROVIDER_VERSION_100 = '100';

export const WALLET_PROVIDER_VERSION_101 = '101';

export const WALLET_PROVIDER_VERSION_102 = '102';

export const WALLET_PROVIDER_VERSION_103 = '103';

export const WALLET_PROVIDER_VERSION_104 = '104';

export const WALLET_PROVIDER_VERSION_105 = '105';

export const WALLET_PROVIDER_VERSION_106 = '106';

export const WALLET_PROVIDER_VERSION_107 = '107';

export const WALLET_PROVIDER_VERSION_108 = '108';

export const WALLET_PROVIDER_VERSION_109 = '109';

export const WALLET_PROVIDER_VERSION_110 = '110';

export const WALLET_PROVIDER_VERSION_111 = '111';

export const WALLET_PROVIDER_VERSION_112 = '112';

export const WALLET_PROVIDER_VERSION_113 = '113';

export const WALLET_PROVIDER_VERSION_114 = '114';

export const WALLET_PROVIDER_VERSION_115 = '115';

export const WALLET_PROVIDER_VERSION_116 = '116';

export const WALLET_PROVIDER_VERSION_117 = '117';

export const WALLET_PROVIDER_VERSION_118 = '118';

export const WALLET_PROVIDER_VERSION_119 = '119';

export const WALLET_PROVIDER_VERSION_120 = '120';

export const WALLET_PROVIDER_VERSION_121 = '121';

export const WALLET_PROVIDER_VERSION_122 = '122';

export const WALLET_PROVIDER_VERSION_123 = '123';

export const WALLET_PROVIDER_VERSION_124 = '124';

export const WALLET_PROVIDER_VERSION_125 = '125';

export const WALLET_PROVIDER_VERSION_126 = '126';

export const WALLET_PROVIDER_VERSION_127 = '127';

export const WALLET_PROVIDER_VERSION_128 = '128';

export const WALLET_PROVIDER_VERSION_129 = '129';

export const WALLET_PROVIDER_VERSION_130 = '130';

export const WALLET_PROVIDER_VERSION_131 = '131';

export const WALLET_PROVIDER_VERSION_132 = '132';

export const WALLET_PROVIDER_VERSION_133 = '133';

export const WALLET_PROVIDER_VERSION_134 = '134';

export const WALLET_PROVIDER_VERSION_135 = '135';

export const WALLET_PROVIDER_VERSION_136 = '136';

export const WALLET_PROVIDER_VERSION_137 = '137';

export const WALLET_PROVIDER_VERSION_138 = '138';

export const WALLET_PROVIDER_VERSION_139 = '139';

export const WALLET_PROVIDER_VERSION_140 = '140';

export const WALLET_PROVIDER_VERSION_141 = '141';

export const WALLET_PROVIDER_VERSION_142 = '142';

export const WALLET_PROVIDER_VERSION_143 = '143';

export const WALLET_PROVIDER_VERSION_144 = '144';

export const WALLET_PROVIDER_VERSION_145 = '145';

export const WALLET_PROVIDER_VERSION_146 = '146';

export const WALLET_PROVIDER_VERSION_147 = '147';

export const WALLET_PROVIDER_VERSION_148 = '148';

export const WALLET_PROVIDER_VERSION_149 = '149';

export const WALLET_PROVIDER_VERSION_150 = '150';

export const WALLET_PROVIDER_VERSION_151 = '151';
