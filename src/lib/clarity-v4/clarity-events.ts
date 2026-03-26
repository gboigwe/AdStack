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

export type ContractEvent = ClarityEvent & {
  type: 'contract_event';
  contractId: string;
  topic: string;
  value: unknown;
};

export function isStxTransferEvent(e: ClarityEvent): e is StxTransferEvent {
  return e.type === 'stx_transfer';
}

export function isFtTransferEvent(e: ClarityEvent): e is FtTransferEvent {
  return e.type === 'ft_transfer';
}

export function isNftTransferEvent(e: ClarityEvent): e is NftTransferEvent {
  return e.type === 'nft_transfer';
}

export function isContractEvent(e: ClarityEvent): e is ContractEvent {
  return e.type === 'contract_event';
}

export function filterEventsByType<T extends ClarityEvent>(
  events: ClarityEvent[],
  guard: (e: ClarityEvent) => e is T
): T[] {
  return events.filter(guard);
}

export function groupEventsByBlock(events: ClarityEvent[]): Record<number, ClarityEvent[]> {
  const grouped: Record<number, ClarityEvent[]> = {};
  for (const event of events) {
    if (!grouped[event.blockHeight]) grouped[event.blockHeight] = [];
    grouped[event.blockHeight].push(event);
  }
  return grouped;
}

export function getEventsAfterBlock(events: ClarityEvent[], blockHeight: number): ClarityEvent[] {
  return events.filter(e => e.blockHeight > blockHeight);
}
