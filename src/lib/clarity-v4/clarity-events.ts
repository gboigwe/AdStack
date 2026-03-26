// Clarity v4 Event Type Utilities

export type ClarityEvent = {
  type: 'stx_transfer' | 'ft_transfer' | 'nft_transfer' | 'contract_event';
  txId: string;
  blockHeight: number;
};

export type StxTransferEvent = ClarityEvent & {
  type: 'stx_transfer';
  sender: string;
  recipient: string;
  amount: bigint;
};

export type FtTransferEvent = ClarityEvent & {
  type: 'ft_transfer';
  assetId: string;
  sender: string;
  recipient: string;
  amount: bigint;
};

export type NftTransferEvent = ClarityEvent & {
  type: 'nft_transfer';
  assetId: string;
  tokenId: bigint;
  sender: string;
  recipient: string;
};
