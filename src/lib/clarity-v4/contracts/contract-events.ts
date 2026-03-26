// Clarity v4 Contract Event Decoders

export type AdStackEventType =
  | 'campaign-created'
  | 'campaign-funded'
  | 'campaign-closed'
  | 'impression-recorded'
  | 'payout-claimed'
  | 'publisher-registered'
  | 'vote-cast'
  | 'proposal-created'
  | 'proposal-executed';

export type AdStackEvent = {
  eventType: AdStackEventType;
  txId: string;
  blockHeight: bigint;
  timestamp?: number;
  data: Record<string, unknown>;
};

export type CampaignCreatedEvent = AdStackEvent & {
  eventType: 'campaign-created';
  data: { advertiser: string; campaignId: bigint; budget: bigint };
};

export type ImpressionRecordedEvent = AdStackEvent & {
  eventType: 'impression-recorded';
  data: { campaignId: bigint; publisher: string; amount: bigint };
};

export type PayoutClaimedEvent = AdStackEvent & {
  eventType: 'payout-claimed';
  data: { publisher: string; amount: bigint; campaignId: bigint };
};

export type VoteCastEvent = AdStackEvent & {
  eventType: 'vote-cast';
  data: { voter: string; proposalId: bigint; support: boolean; weight: bigint };
};

export function isCampaignCreatedEvent(e: AdStackEvent): e is CampaignCreatedEvent {
  return e.eventType === 'campaign-created';
}

export function isImpressionRecordedEvent(e: AdStackEvent): e is ImpressionRecordedEvent {
  return e.eventType === 'impression-recorded';
}

export function isPayoutClaimedEvent(e: AdStackEvent): e is PayoutClaimedEvent {
  return e.eventType === 'payout-claimed';
}

export function isVoteCastEvent(e: AdStackEvent): e is VoteCastEvent {
  return e.eventType === 'vote-cast';
}

export function filterEventsByType<T extends AdStackEvent>(
  events: AdStackEvent[],
  guard: (e: AdStackEvent) => e is T
): T[] {
  return events.filter(guard);
}

export function groupEventsByType(events: AdStackEvent[]): Record<AdStackEventType, AdStackEvent[]> {
  const grouped = {} as Record<AdStackEventType, AdStackEvent[]>;
  for (const e of events) {
    if (!grouped[e.eventType]) grouped[e.eventType] = [];
    grouped[e.eventType].push(e);
  }
  return grouped;
}

export function getTotalPayouts(events: AdStackEvent[]): bigint {
  return filterEventsByType(events, isPayoutClaimedEvent)
    .reduce((sum, e) => sum + e.data.amount, BigInt(0));
}
