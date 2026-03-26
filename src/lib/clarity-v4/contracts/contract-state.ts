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

export function isCampaignActive(c: Campaign): boolean {
  return c.status === 'active';
}

export function isCampaignFunded(c: Campaign): boolean {
  return c.budget > c.spent;
}

export function getCampaignRemainingBudget(c: Campaign): bigint {
  return c.budget > c.spent ? c.budget - c.spent : BigInt(0);
}

export function isPublisherVerified(p: Publisher): boolean {
  return p.status === 'verified';
}

export function isPublisherEligibleForPayout(p: Publisher): boolean {
  return isPublisherVerified(p) && p.pendingPayout > BigInt(0);
}

export function isProposalPassing(p: Proposal): boolean {
  const total = p.votesFor + p.votesAgainst;
  if (total < p.quorum) return false;
  return p.votesFor * BigInt(2) > total;
}

export function getVoteParticipation(p: Proposal): number {
  const total = p.votesFor + p.votesAgainst;
  if (p.quorum === BigInt(0)) return 100;
  return Math.min(100, Number((total * BigInt(100)) / p.quorum));
}

export function canTransitionCampaign(
  from: CampaignStatus,
  to: CampaignStatus
): boolean {
  const transitions: Record<CampaignStatus, CampaignStatus[]> = {
    draft: ['active'],
    active: ['paused', 'closed'],
    paused: ['active', 'closed'],
    closed: ['completed'],
    completed: [],
  };
  return transitions[from].includes(to);
}

export function transitionCampaignStatus(
  campaign: Campaign,
  newStatus: CampaignStatus
): Campaign | null {
  if (!canTransitionCampaign(campaign.status, newStatus)) return null;
  return { ...campaign, status: newStatus };
}

export function calculateCampaignROI(campaign: Campaign): number {
  if (campaign.spent === BigInt(0)) return 0;
  return Number((campaign.budget - campaign.spent) * BigInt(100) / campaign.budget);
}

export function getTopPublishers(publishers: Publisher[], limit = 10): Publisher[] {
  return [...publishers]
    .sort((a, b) => (b.totalEarned > a.totalEarned ? 1 : -1))
    .slice(0, limit);
}

export function summarizeCampaigns(campaigns: Campaign[]): {
  total: number;
  active: number;
  totalBudget: bigint;
  totalSpent: bigint;
} {
  return {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    totalBudget: campaigns.reduce((sum, c) => sum + c.budget, BigInt(0)),
    totalSpent: campaigns.reduce((sum, c) => sum + c.spent, BigInt(0)),
  };
}

export function resetPublisherPayout(publisher: Publisher): Publisher {
  return { ...publisher, pendingPayout: BigInt(0) };
}
