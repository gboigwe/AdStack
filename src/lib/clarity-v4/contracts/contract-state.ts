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

export type Publisher = {
  address: string;
  status: PublisherStatus;
  pendingPayout: bigint;
  totalEarned: bigint;
  impressionCount: bigint;
  registeredAt: bigint;
};

export type Proposal = {
  id: bigint;
  proposer: string;
  title: string;
  description: string;
  status: ProposalStatus;
  votesFor: bigint;
  votesAgainst: bigint;
  quorum: bigint;
  endBlock: bigint;
};
