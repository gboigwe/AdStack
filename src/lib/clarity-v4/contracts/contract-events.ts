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
