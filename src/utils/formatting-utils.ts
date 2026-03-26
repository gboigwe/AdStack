// Formatting utilities for Stacks values
const USTX_PER_STX = 1_000_000n;

export function ustxToStx(ustx: bigint): string {
  const whole = ustx / USTX_PER_STX;
  const frac = ustx % USTX_PER_STX;
  return `${whole}.${frac.toString().padStart(6, '0')}`;
}
