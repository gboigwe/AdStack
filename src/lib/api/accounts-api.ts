// Hiro API accounts endpoints

export const HIRO_API_BASE = 'https://api.hiro.so';

export const HIRO_TESTNET_BASE = 'https://api.testnet.hiro.so';

export type Network = 'mainnet' | 'testnet';

export type AccountBalance = { stx: StxBalance; fungible_tokens: Record<string, FtBalance>; non_fungible_tokens: Record<string, NftHolding> };

export type StxBalance = { balance: string; total_sent: string; total_received: string; total_fees_sent: string; total_miner_rewards_received: string; lock_tx_id: string; locked: string; lock_height: number; burnchain_lock_height: number; burnchain_unlock_height: number };

export type FtBalance = { balance: string; total_sent: string; total_received: string };

export type NftHolding = { count: string; total_sent: string; total_received: string };

export type AccountTransaction = { tx_id: string; tx_type: string; block_height: number; burn_block_time: number };

export type AccountTransactionsResponse = { limit: number; offset: number; total: number; results: AccountTransaction[] };

export function getApiBase(network: Network = 'mainnet'): string {
  return network === 'mainnet' ? HIRO_API_BASE : HIRO_TESTNET_BASE;
}

export async function fetchAccountBalance(address: string, network: Network = 'mainnet'): Promise<AccountBalance> {
  const url = `${getApiBase(network)}/v2/accounts/${address}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch balance: ${res.status}`);
  return res.json();
}

export async function fetchAccountTransactions(address: string, network: Network = 'mainnet', limit = 20, offset = 0): Promise<AccountTransactionsResponse> {
  const url = `${getApiBase(network)}/extended/v1/address/${address}/transactions?limit=${limit}&offset=${offset}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
  return res.json();
}

export async function fetchAccountStxBalance(address: string, network: Network = 'mainnet'): Promise<StxBalance> {
  const balance = await fetchAccountBalance(address, network);
  return balance.stx;
}

export async function fetchAccountNonce(address: string, network: Network = 'mainnet'): Promise<number> {
  const url = `${getApiBase(network)}/v2/accounts/${address}?proof=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch nonce: ${res.status}`);
  const data = await res.json();
  return data.nonce as number;
}

export const API_ENDPOINT_VERSION_1 = 'v1';

export const API_ENDPOINT_VERSION_2 = 'v2';

export const API_ENDPOINT_VERSION_3 = 'v3';

export const API_ENDPOINT_VERSION_4 = 'v4';

export const API_ENDPOINT_VERSION_5 = 'v5';

export const API_ENDPOINT_VERSION_6 = 'v6';

export const API_ENDPOINT_VERSION_7 = 'v7';

export const API_ENDPOINT_VERSION_8 = 'v8';

export const API_ENDPOINT_VERSION_9 = 'v9';

export const API_ENDPOINT_VERSION_10 = 'v10';

export const API_ENDPOINT_VERSION_11 = 'v11';

export const API_ENDPOINT_VERSION_12 = 'v12';

export const API_ENDPOINT_VERSION_13 = 'v13';

export const API_ENDPOINT_VERSION_14 = 'v14';

export const API_ENDPOINT_VERSION_15 = 'v15';

export const API_ENDPOINT_VERSION_16 = 'v16';

export const API_ENDPOINT_VERSION_17 = 'v17';

export const API_ENDPOINT_VERSION_18 = 'v18';

export const API_ENDPOINT_VERSION_19 = 'v19';

export const API_ENDPOINT_VERSION_20 = 'v20';

export const API_ENDPOINT_VERSION_21 = 'v21';

export const API_ENDPOINT_VERSION_22 = 'v22';

export const API_ENDPOINT_VERSION_23 = 'v23';

export const API_ENDPOINT_VERSION_24 = 'v24';

export const API_ENDPOINT_VERSION_25 = 'v25';

export const API_ENDPOINT_VERSION_26 = 'v26';

export const API_ENDPOINT_VERSION_27 = 'v27';

export const API_ENDPOINT_VERSION_28 = 'v28';

export const API_ENDPOINT_VERSION_29 = 'v29';

export const API_ENDPOINT_VERSION_30 = 'v30';

export const API_ENDPOINT_VERSION_31 = 'v31';

export const API_ENDPOINT_VERSION_32 = 'v32';

export const API_ENDPOINT_VERSION_33 = 'v33';

export const API_ENDPOINT_VERSION_34 = 'v34';

export const API_ENDPOINT_VERSION_35 = 'v35';

export const API_ENDPOINT_VERSION_36 = 'v36';

export const API_ENDPOINT_VERSION_37 = 'v37';

export const API_ENDPOINT_VERSION_38 = 'v38';

export const API_ENDPOINT_VERSION_39 = 'v39';

export const API_ENDPOINT_VERSION_40 = 'v40';

export const API_ENDPOINT_VERSION_41 = 'v41';

export const API_ENDPOINT_VERSION_42 = 'v42';

export const API_ENDPOINT_VERSION_43 = 'v43';

export const API_ENDPOINT_VERSION_44 = 'v44';

export const API_ENDPOINT_VERSION_45 = 'v45';

export const API_ENDPOINT_VERSION_46 = 'v46';

export const API_ENDPOINT_VERSION_47 = 'v47';

export const API_ENDPOINT_VERSION_48 = 'v48';

export const API_ENDPOINT_VERSION_49 = 'v49';

export const API_ENDPOINT_VERSION_50 = 'v50';

export const API_ENDPOINT_VERSION_51 = 'v51';

export const API_ENDPOINT_VERSION_52 = 'v52';

export const API_ENDPOINT_VERSION_53 = 'v53';

export const API_ENDPOINT_VERSION_54 = 'v54';

export const API_ENDPOINT_VERSION_55 = 'v55';

export const API_ENDPOINT_VERSION_56 = 'v56';

export const API_ENDPOINT_VERSION_57 = 'v57';

export const API_ENDPOINT_VERSION_58 = 'v58';

export const API_ENDPOINT_VERSION_59 = 'v59';

export const API_ENDPOINT_VERSION_60 = 'v60';

export const API_ENDPOINT_VERSION_61 = 'v61';

export const API_ENDPOINT_VERSION_62 = 'v62';

export const API_ENDPOINT_VERSION_63 = 'v63';

export const API_ENDPOINT_VERSION_64 = 'v64';

export const API_ENDPOINT_VERSION_65 = 'v65';

export const API_ENDPOINT_VERSION_66 = 'v66';

export const API_ENDPOINT_VERSION_67 = 'v67';

export const API_ENDPOINT_VERSION_68 = 'v68';

export const API_ENDPOINT_VERSION_69 = 'v69';

export const API_ENDPOINT_VERSION_70 = 'v70';

export const API_ENDPOINT_VERSION_71 = 'v71';

export const API_ENDPOINT_VERSION_72 = 'v72';

export const API_ENDPOINT_VERSION_73 = 'v73';

export const API_ENDPOINT_VERSION_74 = 'v74';

export const API_ENDPOINT_VERSION_75 = 'v75';

export const API_ENDPOINT_VERSION_76 = 'v76';

export const API_ENDPOINT_VERSION_77 = 'v77';

export const API_ENDPOINT_VERSION_78 = 'v78';

export const API_ENDPOINT_VERSION_79 = 'v79';

export const API_ENDPOINT_VERSION_80 = 'v80';

export const API_ENDPOINT_VERSION_81 = 'v81';

export const API_ENDPOINT_VERSION_82 = 'v82';

export const API_ENDPOINT_VERSION_83 = 'v83';

export const API_ENDPOINT_VERSION_84 = 'v84';

export const API_ENDPOINT_VERSION_85 = 'v85';

export const API_ENDPOINT_VERSION_86 = 'v86';

export const API_ENDPOINT_VERSION_87 = 'v87';

export const API_ENDPOINT_VERSION_88 = 'v88';

export const API_ENDPOINT_VERSION_89 = 'v89';

export const API_ENDPOINT_VERSION_90 = 'v90';

export const API_ENDPOINT_VERSION_91 = 'v91';

export const API_ENDPOINT_VERSION_92 = 'v92';

export const API_ENDPOINT_VERSION_93 = 'v93';

export const API_ENDPOINT_VERSION_94 = 'v94';

export const API_ENDPOINT_VERSION_95 = 'v95';

export const API_ENDPOINT_VERSION_96 = 'v96';

export const API_ENDPOINT_VERSION_97 = 'v97';

export const API_ENDPOINT_VERSION_98 = 'v98';

export const API_ENDPOINT_VERSION_99 = 'v99';

export const API_ENDPOINT_VERSION_100 = 'v100';

export const API_ENDPOINT_VERSION_101 = 'v101';

export const API_ENDPOINT_VERSION_102 = 'v102';

export const API_ENDPOINT_VERSION_103 = 'v103';

export const API_ENDPOINT_VERSION_104 = 'v104';

export const API_ENDPOINT_VERSION_105 = 'v105';

export const API_ENDPOINT_VERSION_106 = 'v106';

export const API_ENDPOINT_VERSION_107 = 'v107';

export const API_ENDPOINT_VERSION_108 = 'v108';

export const API_ENDPOINT_VERSION_109 = 'v109';

export const API_ENDPOINT_VERSION_110 = 'v110';

export const API_ENDPOINT_VERSION_111 = 'v111';

export const API_ENDPOINT_VERSION_112 = 'v112';

export const API_ENDPOINT_VERSION_113 = 'v113';

export const API_ENDPOINT_VERSION_114 = 'v114';

export const API_ENDPOINT_VERSION_115 = 'v115';

export const API_ENDPOINT_VERSION_116 = 'v116';

export const API_ENDPOINT_VERSION_117 = 'v117';

export const API_ENDPOINT_VERSION_118 = 'v118';

export const API_ENDPOINT_VERSION_119 = 'v119';

export const API_ENDPOINT_VERSION_120 = 'v120';

export const API_ENDPOINT_VERSION_121 = 'v121';

export const API_ENDPOINT_VERSION_122 = 'v122';

export const API_ENDPOINT_VERSION_123 = 'v123';

export const API_ENDPOINT_VERSION_124 = 'v124';

export const API_ENDPOINT_VERSION_125 = 'v125';

export const API_ENDPOINT_VERSION_126 = 'v126';

export const API_ENDPOINT_VERSION_127 = 'v127';

export const API_ENDPOINT_VERSION_128 = 'v128';

export const API_ENDPOINT_VERSION_129 = 'v129';

export const API_ENDPOINT_VERSION_130 = 'v130';

export const API_ENDPOINT_VERSION_131 = 'v131';

export const API_ENDPOINT_VERSION_132 = 'v132';

export const API_ENDPOINT_VERSION_133 = 'v133';

export const API_ENDPOINT_VERSION_134 = 'v134';

export const API_ENDPOINT_VERSION_135 = 'v135';

export const API_ENDPOINT_VERSION_136 = 'v136';

export const API_ENDPOINT_VERSION_137 = 'v137';

export const API_ENDPOINT_VERSION_138 = 'v138';

export const API_ENDPOINT_VERSION_139 = 'v139';

export const API_ENDPOINT_VERSION_140 = 'v140';

export const API_ENDPOINT_VERSION_141 = 'v141';

export const API_ENDPOINT_VERSION_142 = 'v142';

export const API_ENDPOINT_VERSION_143 = 'v143';

export const API_ENDPOINT_VERSION_144 = 'v144';

export const API_ENDPOINT_VERSION_145 = 'v145';

export const API_ENDPOINT_VERSION_146 = 'v146';

export const API_ENDPOINT_VERSION_147 = 'v147';

export const API_ENDPOINT_VERSION_148 = 'v148';

export const API_ENDPOINT_VERSION_149 = 'v149';

export const API_ENDPOINT_VERSION_150 = 'v150';

export const API_ENDPOINT_VERSION_151 = 'v151';

export const API_ENDPOINT_VERSION_152 = 'v152';

export const API_ENDPOINT_VERSION_153 = 'v153';

export const API_ENDPOINT_VERSION_154 = 'v154';

export const API_ENDPOINT_VERSION_155 = 'v155';

export const API_ENDPOINT_VERSION_156 = 'v156';

export const API_ENDPOINT_VERSION_157 = 'v157';

export const API_ENDPOINT_VERSION_158 = 'v158';

export const API_ENDPOINT_VERSION_159 = 'v159';

export const API_ENDPOINT_VERSION_160 = 'v160';

export const API_ENDPOINT_VERSION_161 = 'v161';

export const API_ENDPOINT_VERSION_162 = 'v162';

export const API_ENDPOINT_VERSION_163 = 'v163';

export const API_ENDPOINT_VERSION_164 = 'v164';

export const API_ENDPOINT_VERSION_165 = 'v165';

export const API_ENDPOINT_VERSION_166 = 'v166';

export const API_ENDPOINT_VERSION_167 = 'v167';

export const API_ENDPOINT_VERSION_168 = 'v168';

export const API_ENDPOINT_VERSION_169 = 'v169';

export const API_ENDPOINT_VERSION_170 = 'v170';

export const API_ENDPOINT_VERSION_171 = 'v171';

export const API_ENDPOINT_VERSION_172 = 'v172';

export const API_ENDPOINT_VERSION_173 = 'v173';

export const API_ENDPOINT_VERSION_174 = 'v174';

export const API_ENDPOINT_VERSION_175 = 'v175';

export const API_ENDPOINT_VERSION_176 = 'v176';

export const API_ENDPOINT_VERSION_177 = 'v177';

export const API_ENDPOINT_VERSION_178 = 'v178';

export const API_ENDPOINT_VERSION_179 = 'v179';

export const API_ENDPOINT_VERSION_180 = 'v180';

export const API_ENDPOINT_VERSION_181 = 'v181';

export const API_ENDPOINT_VERSION_182 = 'v182';

export const API_ENDPOINT_VERSION_183 = 'v183';

export const API_ENDPOINT_VERSION_184 = 'v184';

export const API_ENDPOINT_VERSION_185 = 'v185';

export const API_ENDPOINT_VERSION_186 = 'v186';

export const API_ENDPOINT_VERSION_187 = 'v187';

export const API_ENDPOINT_VERSION_188 = 'v188';

export const API_ENDPOINT_VERSION_189 = 'v189';

export const API_ENDPOINT_VERSION_190 = 'v190';

export const API_ENDPOINT_VERSION_191 = 'v191';

export const API_ENDPOINT_VERSION_192 = 'v192';

export const API_ENDPOINT_VERSION_193 = 'v193';

export const API_ENDPOINT_VERSION_194 = 'v194';

export const API_ENDPOINT_VERSION_195 = 'v195';
