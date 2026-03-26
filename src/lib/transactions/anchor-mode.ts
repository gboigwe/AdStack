// Stacks Transactions anchor mode utilities

export const ANCHOR_MODE_ANY = 1;

export const ANCHOR_MODE_ON_CHAIN_ONLY = 2;

export const ANCHOR_MODE_OFF_CHAIN_ONLY = 3;

export type AnchorModeType = 'any' | 'on_chain_only' | 'off_chain_only';

export type AnchorModeCode = 1 | 2 | 3;

export function anchorModeToCode(mode: AnchorModeType): AnchorModeCode {
  switch (mode) {
    case 'any': return ANCHOR_MODE_ANY;
    case 'on_chain_only': return ANCHOR_MODE_ON_CHAIN_ONLY;
    case 'off_chain_only': return ANCHOR_MODE_OFF_CHAIN_ONLY;
  }
}
