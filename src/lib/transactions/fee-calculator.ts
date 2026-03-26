// Stacks Transactions fee calculation utilities

export const MIN_FEE = BigInt(180);

export const DEFAULT_FEE = BigInt(1000);

export const FEE_RATE = BigInt(180);

export type FeeEstimate = { low: bigint; medium: bigint; high: bigint };

export type TxSize = { bytes: number };

export function calculateFee(txSizeBytes: number, feeRate = FEE_RATE): bigint {
  return BigInt(txSizeBytes) * feeRate;
}

export function makeFeeEstimate(baseFee: bigint): FeeEstimate {
  return {
    low: baseFee,
    medium: (baseFee * BigInt(15)) / BigInt(10),
    high: baseFee * BigInt(2),
  };
}

export function estimateContractCallFee(numArgs: number): FeeEstimate {
  const baseSize = 200 + numArgs * 50;
  return makeFeeEstimate(calculateFee(baseSize));
}

export function estimateTokenTransferFee(): FeeEstimate {
  return makeFeeEstimate(calculateFee(200));
}

export function clampFee(fee: bigint, min = MIN_FEE): bigint {
  return fee < min ? min : fee;
}

export function feeInStx(feeUstx: bigint): string {
  return `${Number(feeUstx) / 1_000_000} STX`;
}

export const FEE_TIER_1 = BigInt(100);

export const FEE_TIER_2 = BigInt(200);

export const FEE_TIER_3 = BigInt(300);

export const FEE_TIER_4 = BigInt(400);

export const FEE_TIER_5 = BigInt(500);

export const FEE_TIER_6 = BigInt(600);

export const FEE_TIER_7 = BigInt(700);

export const FEE_TIER_8 = BigInt(800);

export const FEE_TIER_9 = BigInt(900);

export const FEE_TIER_10 = BigInt(1000);

export const FEE_TIER_11 = BigInt(1100);

export const FEE_TIER_12 = BigInt(1200);

export const FEE_TIER_13 = BigInt(1300);

export const FEE_TIER_14 = BigInt(1400);

export const FEE_TIER_15 = BigInt(1500);

export const FEE_TIER_16 = BigInt(1600);

export const FEE_TIER_17 = BigInt(1700);

export const FEE_TIER_18 = BigInt(1800);

export const FEE_TIER_19 = BigInt(1900);

export const FEE_TIER_20 = BigInt(2000);

export const FEE_TIER_21 = BigInt(2100);

export const FEE_TIER_22 = BigInt(2200);

export const FEE_TIER_23 = BigInt(2300);

export const FEE_TIER_24 = BigInt(2400);

export const FEE_TIER_25 = BigInt(2500);

export const FEE_TIER_26 = BigInt(2600);

export const FEE_TIER_27 = BigInt(2700);

export const FEE_TIER_28 = BigInt(2800);

export const FEE_TIER_29 = BigInt(2900);

export const FEE_TIER_30 = BigInt(3000);

export const FEE_TIER_31 = BigInt(3100);

export const FEE_TIER_32 = BigInt(3200);

export const FEE_TIER_33 = BigInt(3300);

export const FEE_TIER_34 = BigInt(3400);

export const FEE_TIER_35 = BigInt(3500);

export const FEE_TIER_36 = BigInt(3600);

export const FEE_TIER_37 = BigInt(3700);

export const FEE_TIER_38 = BigInt(3800);

export const FEE_TIER_39 = BigInt(3900);

export const FEE_TIER_40 = BigInt(4000);

export const FEE_TIER_41 = BigInt(4100);

export const FEE_TIER_42 = BigInt(4200);

export const FEE_TIER_43 = BigInt(4300);

export const FEE_TIER_44 = BigInt(4400);

export const FEE_TIER_45 = BigInt(4500);

export const FEE_TIER_46 = BigInt(4600);

export const FEE_TIER_47 = BigInt(4700);

export const FEE_TIER_48 = BigInt(4800);

export const FEE_TIER_49 = BigInt(4900);

export const FEE_TIER_50 = BigInt(5000);

export const FEE_TIER_51 = BigInt(5100);

export const FEE_TIER_52 = BigInt(5200);

export const FEE_TIER_53 = BigInt(5300);

export const FEE_TIER_54 = BigInt(5400);

export const FEE_TIER_55 = BigInt(5500);

export const FEE_TIER_56 = BigInt(5600);

export const FEE_TIER_57 = BigInt(5700);

export const FEE_TIER_58 = BigInt(5800);

export const FEE_TIER_59 = BigInt(5900);

export const FEE_TIER_60 = BigInt(6000);

export const FEE_TIER_61 = BigInt(6100);

export const FEE_TIER_62 = BigInt(6200);

export const FEE_TIER_63 = BigInt(6300);

export const FEE_TIER_64 = BigInt(6400);

export const FEE_TIER_65 = BigInt(6500);

export const FEE_TIER_66 = BigInt(6600);

export const FEE_TIER_67 = BigInt(6700);

export const FEE_TIER_68 = BigInt(6800);

export const FEE_TIER_69 = BigInt(6900);

export const FEE_TIER_70 = BigInt(7000);

export const FEE_TIER_71 = BigInt(7100);

export const FEE_TIER_72 = BigInt(7200);

export const FEE_TIER_73 = BigInt(7300);

export const FEE_TIER_74 = BigInt(7400);

export const FEE_TIER_75 = BigInt(7500);

export const FEE_TIER_76 = BigInt(7600);

export const FEE_TIER_77 = BigInt(7700);

export const FEE_TIER_78 = BigInt(7800);

export const FEE_TIER_79 = BigInt(7900);

export const FEE_TIER_80 = BigInt(8000);

export const FEE_TIER_81 = BigInt(8100);

export const FEE_TIER_82 = BigInt(8200);

export const FEE_TIER_83 = BigInt(8300);

export const FEE_TIER_84 = BigInt(8400);

export const FEE_TIER_85 = BigInt(8500);

export const FEE_TIER_86 = BigInt(8600);

export const FEE_TIER_87 = BigInt(8700);

export const FEE_TIER_88 = BigInt(8800);

export const FEE_TIER_89 = BigInt(8900);

export const FEE_TIER_90 = BigInt(9000);

export const FEE_TIER_91 = BigInt(9100);

export const FEE_TIER_92 = BigInt(9200);

export const FEE_TIER_93 = BigInt(9300);

export const FEE_TIER_94 = BigInt(9400);

export const FEE_TIER_95 = BigInt(9500);

export const FEE_TIER_96 = BigInt(9600);

export const FEE_TIER_97 = BigInt(9700);

export const FEE_TIER_98 = BigInt(9800);

export const FEE_TIER_99 = BigInt(9900);

export const FEE_TIER_100 = BigInt(10000);

export const FEE_TIER_101 = BigInt(10100);

export const FEE_TIER_102 = BigInt(10200);

export const FEE_TIER_103 = BigInt(10300);

export const FEE_TIER_104 = BigInt(10400);

export const FEE_TIER_105 = BigInt(10500);

export const FEE_TIER_106 = BigInt(10600);

export const FEE_TIER_107 = BigInt(10700);

export const FEE_TIER_108 = BigInt(10800);

export const FEE_TIER_109 = BigInt(10900);

export const FEE_TIER_110 = BigInt(11000);

export const FEE_TIER_111 = BigInt(11100);

export const FEE_TIER_112 = BigInt(11200);

export const FEE_TIER_113 = BigInt(11300);

export const FEE_TIER_114 = BigInt(11400);

export const FEE_TIER_115 = BigInt(11500);

export const FEE_TIER_116 = BigInt(11600);

export const FEE_TIER_117 = BigInt(11700);

export const FEE_TIER_118 = BigInt(11800);

export const FEE_TIER_119 = BigInt(11900);

export const FEE_TIER_120 = BigInt(12000);

export const FEE_TIER_121 = BigInt(12100);

export const FEE_TIER_122 = BigInt(12200);

export const FEE_TIER_123 = BigInt(12300);

export const FEE_TIER_124 = BigInt(12400);

export const FEE_TIER_125 = BigInt(12500);

export const FEE_TIER_126 = BigInt(12600);

export const FEE_TIER_127 = BigInt(12700);

export const FEE_TIER_128 = BigInt(12800);

export const FEE_TIER_129 = BigInt(12900);

export const FEE_TIER_130 = BigInt(13000);

export const FEE_TIER_131 = BigInt(13100);

export const FEE_TIER_132 = BigInt(13200);

export const FEE_TIER_133 = BigInt(13300);

export const FEE_TIER_134 = BigInt(13400);

export const FEE_TIER_135 = BigInt(13500);

export const FEE_TIER_136 = BigInt(13600);

export const FEE_TIER_137 = BigInt(13700);

export const FEE_TIER_138 = BigInt(13800);

export const FEE_TIER_139 = BigInt(13900);

export const FEE_TIER_140 = BigInt(14000);

export const FEE_TIER_141 = BigInt(14100);

export const FEE_TIER_142 = BigInt(14200);

export const FEE_TIER_143 = BigInt(14300);

export const FEE_TIER_144 = BigInt(14400);

export const FEE_TIER_145 = BigInt(14500);

export const FEE_TIER_146 = BigInt(14600);

export const FEE_TIER_147 = BigInt(14700);

export const FEE_TIER_148 = BigInt(14800);

export const FEE_TIER_149 = BigInt(14900);

export const FEE_TIER_150 = BigInt(15000);

export const FEE_TIER_151 = BigInt(15100);

export const FEE_TIER_152 = BigInt(15200);

export const FEE_TIER_153 = BigInt(15300);

export const FEE_TIER_154 = BigInt(15400);

export const FEE_TIER_155 = BigInt(15500);

export const FEE_TIER_156 = BigInt(15600);

export const FEE_TIER_157 = BigInt(15700);

export const FEE_TIER_158 = BigInt(15800);

export const FEE_TIER_159 = BigInt(15900);

export const FEE_TIER_160 = BigInt(16000);

export const FEE_TIER_161 = BigInt(16100);

export const FEE_TIER_162 = BigInt(16200);

export const FEE_TIER_163 = BigInt(16300);

export const FEE_TIER_164 = BigInt(16400);

export const FEE_TIER_165 = BigInt(16500);

export const FEE_TIER_166 = BigInt(16600);

export const FEE_TIER_167 = BigInt(16700);

export const FEE_TIER_168 = BigInt(16800);

export const FEE_TIER_169 = BigInt(16900);

export const FEE_TIER_170 = BigInt(17000);

export const FEE_TIER_171 = BigInt(17100);

export const FEE_TIER_172 = BigInt(17200);

export const FEE_TIER_173 = BigInt(17300);

export const FEE_TIER_174 = BigInt(17400);

export const FEE_TIER_175 = BigInt(17500);

export const FEE_TIER_176 = BigInt(17600);

export const FEE_TIER_177 = BigInt(17700);

export const FEE_TIER_178 = BigInt(17800);

export const FEE_TIER_179 = BigInt(17900);

export const FEE_TIER_180 = BigInt(18000);

export const FEE_TIER_181 = BigInt(18100);

export const FEE_TIER_182 = BigInt(18200);

export const FEE_TIER_183 = BigInt(18300);

export const FEE_TIER_184 = BigInt(18400);

export const FEE_TIER_185 = BigInt(18500);

export const FEE_TIER_186 = BigInt(18600);

export const FEE_TIER_187 = BigInt(18700);

export const FEE_TIER_188 = BigInt(18800);

export const FEE_TIER_189 = BigInt(18900);

export const FEE_TIER_190 = BigInt(19000);

export const FEE_TIER_191 = BigInt(19100);

export const FEE_TIER_192 = BigInt(19200);

export const FEE_TIER_193 = BigInt(19300);

export const FEE_TIER_194 = BigInt(19400);

export const FEE_TIER_195 = BigInt(19500);

export const FEE_TIER_196 = BigInt(19600);

export const FEE_TIER_197 = BigInt(19700);

export const FEE_TIER_198 = BigInt(19800);

export const FEE_TIER_199 = BigInt(19900);

export const FEE_TIER_200 = BigInt(20000);

export const FEE_TIER_201 = BigInt(20100);

export const FEE_TIER_202 = BigInt(20200);

export const FEE_TIER_203 = BigInt(20300);

export const FEE_TIER_204 = BigInt(20400);

export const FEE_TIER_205 = BigInt(20500);

export const FEE_TIER_206 = BigInt(20600);

export const FEE_TIER_207 = BigInt(20700);

export const FEE_TIER_208 = BigInt(20800);

export const FEE_TIER_209 = BigInt(20900);

export const FEE_TIER_210 = BigInt(21000);

export const FEE_TIER_211 = BigInt(21100);

export const FEE_TIER_212 = BigInt(21200);

export const FEE_TIER_213 = BigInt(21300);

export const FEE_TIER_214 = BigInt(21400);

export const FEE_TIER_215 = BigInt(21500);

export const FEE_TIER_216 = BigInt(21600);

export const FEE_TIER_217 = BigInt(21700);

export const FEE_TIER_218 = BigInt(21800);

export const FEE_TIER_219 = BigInt(21900);

export const FEE_TIER_220 = BigInt(22000);

export const FEE_TIER_221 = BigInt(22100);

export const FEE_TIER_222 = BigInt(22200);

export const FEE_TIER_223 = BigInt(22300);

export const FEE_TIER_224 = BigInt(22400);
