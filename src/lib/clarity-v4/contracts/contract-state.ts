// Clarity v4 Contract State Management Patterns

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'closed' | 'completed';

export type PublisherStatus = 'pending' | 'verified' | 'suspended' | 'banned';

export type ProposalStatus = 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';

export type Campaign = {
  id: bigint;
  advertiser: string;
  budget: bigint;
  spent: bigint;
  status: CampaignStatus;
  startBlock: bigint;
  endBlock: bigint;
  impressionRate: bigint;
};
