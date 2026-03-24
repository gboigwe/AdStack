import { describe, it, expect } from 'vitest';
import {
  campaignStatusLabel,
  isCampaignTerminal,
  proposalStatusLabel,
  isProposalVotable,
  escrowStatusLabel,
  payoutStatusLabel,
  disputeStatusLabel,
  isDisputeOpen,
} from '@/lib/status-utils';
import {
  CampaignStatus,
  ProposalStatus,
  EscrowStatus,
  PayoutStatus,
  DisputeStatus,
} from '@/types/contracts';

describe('campaignStatusLabel', () => {
  it('maps all campaign statuses to labels', () => {
    expect(campaignStatusLabel(CampaignStatus.DRAFT)).toBe('Draft');
    expect(campaignStatusLabel(CampaignStatus.ACTIVE)).toBe('Active');
    expect(campaignStatusLabel(CampaignStatus.PAUSED)).toBe('Paused');
    expect(campaignStatusLabel(CampaignStatus.COMPLETED)).toBe('Completed');
    expect(campaignStatusLabel(CampaignStatus.CANCELLED)).toBe('Cancelled');
  });
});

describe('isCampaignTerminal', () => {
  it('returns true for completed and cancelled', () => {
    expect(isCampaignTerminal(CampaignStatus.COMPLETED)).toBe(true);
    expect(isCampaignTerminal(CampaignStatus.CANCELLED)).toBe(true);
  });

  it('returns false for non-terminal statuses', () => {
    expect(isCampaignTerminal(CampaignStatus.DRAFT)).toBe(false);
    expect(isCampaignTerminal(CampaignStatus.ACTIVE)).toBe(false);
    expect(isCampaignTerminal(CampaignStatus.PAUSED)).toBe(false);
  });
});

describe('proposalStatusLabel', () => {
  it('maps all proposal statuses to labels', () => {
    expect(proposalStatusLabel(ProposalStatus.ACTIVE)).toBe('Active');
    expect(proposalStatusLabel(ProposalStatus.PASSED)).toBe('Passed');
    expect(proposalStatusLabel(ProposalStatus.REJECTED)).toBe('Rejected');
    expect(proposalStatusLabel(ProposalStatus.EXECUTED)).toBe('Executed');
  });
});

describe('isProposalVotable', () => {
  it('returns true only for active proposals', () => {
    expect(isProposalVotable(ProposalStatus.ACTIVE)).toBe(true);
    expect(isProposalVotable(ProposalStatus.PASSED)).toBe(false);
    expect(isProposalVotable(ProposalStatus.REJECTED)).toBe(false);
    expect(isProposalVotable(ProposalStatus.EXECUTED)).toBe(false);
  });
});

describe('escrowStatusLabel', () => {
  it('maps all escrow statuses to labels', () => {
    expect(escrowStatusLabel(EscrowStatus.ACTIVE)).toBe('Active');
    expect(escrowStatusLabel(EscrowStatus.COMPLETED)).toBe('Completed');
    expect(escrowStatusLabel(EscrowStatus.REFUNDED)).toBe('Refunded');
  });
});

describe('payoutStatusLabel', () => {
  it('maps all payout statuses to labels', () => {
    expect(payoutStatusLabel(PayoutStatus.PENDING)).toBe('Pending');
    expect(payoutStatusLabel(PayoutStatus.COMPLETED)).toBe('Completed');
    expect(payoutStatusLabel(PayoutStatus.FAILED)).toBe('Failed');
  });
});

describe('disputeStatusLabel', () => {
  it('maps all dispute statuses to labels', () => {
    expect(disputeStatusLabel(DisputeStatus.OPEN)).toBe('Open');
    expect(disputeStatusLabel(DisputeStatus.IN_PROGRESS)).toBe('In Progress');
    expect(disputeStatusLabel(DisputeStatus.RESOLVED)).toBe('Resolved');
    expect(disputeStatusLabel(DisputeStatus.DISMISSED)).toBe('Dismissed');
  });
});

describe('isDisputeOpen', () => {
  it('returns true for open and in-progress', () => {
    expect(isDisputeOpen(DisputeStatus.OPEN)).toBe(true);
    expect(isDisputeOpen(DisputeStatus.IN_PROGRESS)).toBe(true);
  });

  it('returns false for resolved and dismissed', () => {
    expect(isDisputeOpen(DisputeStatus.RESOLVED)).toBe(false);
    expect(isDisputeOpen(DisputeStatus.DISMISSED)).toBe(false);
  });
});
