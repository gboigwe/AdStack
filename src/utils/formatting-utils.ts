// Formatting utilities for Stacks values
const USTX_PER_STX = 1_000_000n;

export function ustxToStx(ustx: bigint): string {
  const whole = ustx / USTX_PER_STX;
  const frac = ustx % USTX_PER_STX;
  return `${whole}.${frac.toString().padStart(6, '0')}`;
}

export function stxToUstx(stx: string): bigint {
  const [whole, frac = '0'] = stx.split('.');
  const fracPadded = frac.padEnd(6, '0').slice(0, 6);
  return BigInt(whole) * USTX_PER_STX + BigInt(fracPadded);
}

export function formatStxAmount(ustx: bigint, decimals = 2): string {
  const stxStr = ustxToStx(ustx);
  const [whole, frac] = stxStr.split('.');
  return `${Number(whole).toLocaleString()}.${frac.slice(0, decimals)} STX`;
}

export function formatTxId(txId: string, short = false): string {
  if (!txId.startsWith('0x')) return txId;
  if (short) return `${txId.slice(0, 8)}...${txId.slice(-6)}`;
  return txId;
}

export function formatPrincipal(principal: string, short = false): string {
  if (!short) return principal;
  if (principal.includes('.')) {
    const [addr, name] = principal.split('.');
    return `${addr.slice(0, 6)}...${addr.slice(-4)}.${name}`;
  }
  return `${principal.slice(0, 6)}...${principal.slice(-4)}`;
}
