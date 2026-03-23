import {
  CampaignStatus,
  ProposalStatus,
  EscrowStatus,
  PayoutStatus,
  DisputeStatus,
} from '@/types/contracts';

/* ─── Campaign Status ────────────────────────────────────── */

const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  [CampaignStatus.DRAFT]: 'Draft',
  [CampaignStatus.ACTIVE]: 'Active',
  [CampaignStatus.PAUSED]: 'Paused',
  [CampaignStatus.COMPLETED]: 'Completed',
  [CampaignStatus.CANCELLED]: 'Cancelled',
};

export function campaignStatusLabel(status: CampaignStatus): string {
  return CAMPAIGN_STATUS_LABELS[status];
}

export function isCampaignTerminal(status: CampaignStatus): boolean {
  return (
    status === CampaignStatus.COMPLETED || status === CampaignStatus.CANCELLED
  );
}

/* ─── Proposal Status ────────────────────────────────────── */

const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  [ProposalStatus.ACTIVE]: 'Active',
  [ProposalStatus.PASSED]: 'Passed',
  [ProposalStatus.REJECTED]: 'Rejected',
  [ProposalStatus.EXECUTED]: 'Executed',
};

export function proposalStatusLabel(status: ProposalStatus): string {
  return PROPOSAL_STATUS_LABELS[status];
}

export function isProposalVotable(status: ProposalStatus): boolean {
  return status === ProposalStatus.ACTIVE;
}

/* ─── Escrow Status ──────────────────────────────────────── */

const ESCROW_STATUS_LABELS: Record<EscrowStatus, string> = {
  [EscrowStatus.ACTIVE]: 'Active',
  [EscrowStatus.COMPLETED]: 'Completed',
  [EscrowStatus.REFUNDED]: 'Refunded',
};

export function escrowStatusLabel(status: EscrowStatus): string {
  return ESCROW_STATUS_LABELS[status];
}

/* ─── Payout Status ──────────────────────────────────────── */

const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  [PayoutStatus.PENDING]: 'Pending',
  [PayoutStatus.COMPLETED]: 'Completed',
  [PayoutStatus.FAILED]: 'Failed',
};

export function payoutStatusLabel(status: PayoutStatus): string {
  return PAYOUT_STATUS_LABELS[status];
}

/* ─── Dispute Status ─────────────────────────────────────── */

const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  [DisputeStatus.OPEN]: 'Open',
  [DisputeStatus.IN_PROGRESS]: 'In Progress',
  [DisputeStatus.RESOLVED]: 'Resolved',
  [DisputeStatus.DISMISSED]: 'Dismissed',
};

export function disputeStatusLabel(status: DisputeStatus): string {
  return DISPUTE_STATUS_LABELS[status];
}

export function isDisputeOpen(status: DisputeStatus): boolean {
  return (
    status === DisputeStatus.OPEN || status === DisputeStatus.IN_PROGRESS
  );
}
