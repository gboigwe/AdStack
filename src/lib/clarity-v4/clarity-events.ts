// Clarity v4 Event Type Utilities

export type ClarityEvent = {
  type: 'stx_transfer' | 'ft_transfer' | 'nft_transfer' | 'contract_event';
  txId: string;
  blockHeight: number;
};
