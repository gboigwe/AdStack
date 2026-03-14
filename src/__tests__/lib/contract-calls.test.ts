import { describe, it, expect } from 'vitest';
import {
  buildCreateCampaign,
  buildPauseCampaign,
  buildResumeCampaign,
  buildRegisterUser,
  buildClaimPayout,
  buildSubmitView,
  buildCreateProposal,
  buildCastVote,
  buildReadCampaign,
  buildReadAnalytics,
  buildReadUserProfile,
} from '@/lib/contract-calls';
import { CONTRACT_ADDRESS, CONTRACTS, BLOCK_TIME } from '@/lib/stacks-config';

describe('contract-calls', () => {
  const sender = 'SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD';

  describe('buildCreateCampaign', () => {
    it('returns correct contract and function', () => {
      const result = buildCreateCampaign(sender, {
        name: 'Summer Sale',
        budget: '100',
        dailyBudget: '10',
        duration: 30,
      });
      expect(result.contractAddress).toBe(CONTRACT_ADDRESS);
      expect(result.contractName).toBe(CONTRACTS.PROMO_MANAGER);
      expect(result.functionName).toBe('create-campaign');
    });

    it('includes four function args: name, budget, daily, duration', () => {
      const result = buildCreateCampaign(sender, {
        name: 'Test',
        budget: '50',
        dailyBudget: '5',
        duration: 7,
      });
      expect(result.functionArgs).toHaveLength(4);
      expect(result.functionArgs[0]).toEqual({ type: 'string-ascii', value: 'Test' });
      expect(result.functionArgs[3]).toEqual({ type: 'uint', value: 7n });
    });

    it('converts STX amounts to micro-STX', () => {
      const result = buildCreateCampaign(sender, {
        name: 'Big Budget',
        budget: '100',
        dailyBudget: '10',
        duration: 14,
      });
      // 100 STX = 100_000_000 micro-STX
      expect(result.functionArgs[1]).toEqual({ type: 'uint', value: 100_000_000n });
      expect(result.functionArgs[2]).toEqual({ type: 'uint', value: 10_000_000n });
    });

    it('includes post conditions', () => {
      const result = buildCreateCampaign(sender, {
        name: 'PC Test',
        budget: '50',
        dailyBudget: '5',
        duration: 7,
      });
      expect(result.postConditions.length).toBeGreaterThan(0);
    });
  });

  describe('buildPauseCampaign', () => {
    it('targets promo-manager.pause-campaign', () => {
      const result = buildPauseCampaign(42);
      expect(result.contractName).toBe(CONTRACTS.PROMO_MANAGER);
      expect(result.functionName).toBe('pause-campaign');
      expect(result.functionArgs[0]).toEqual({ type: 'uint', value: 42n });
    });
  });

  describe('buildResumeCampaign', () => {
    it('targets promo-manager.resume-campaign', () => {
      const result = buildResumeCampaign(7);
      expect(result.contractName).toBe(CONTRACTS.PROMO_MANAGER);
      expect(result.functionName).toBe('resume-campaign');
      expect(result.functionArgs[0]).toEqual({ type: 'uint', value: 7n });
    });
  });

  describe('buildRegisterUser', () => {
    it('targets user-profiles.register', () => {
      const result = buildRegisterUser({ role: 'publisher', displayName: 'Alice' });
      expect(result.contractName).toBe(CONTRACTS.USER_PROFILES);
      expect(result.functionName).toBe('register');
      expect(result.functionArgs).toHaveLength(2);
      expect(result.functionArgs[0]).toEqual({ type: 'string-ascii', value: 'publisher' });
      expect(result.functionArgs[1]).toEqual({ type: 'string-ascii', value: 'Alice' });
    });
  });

  describe('buildClaimPayout', () => {
    it('targets cash-distributor.claim-payout', () => {
      const result = buildClaimPayout(1, 50);
      expect(result.contractName).toBe(CONTRACTS.CASH_DISTRIBUTOR);
      expect(result.functionName).toBe('claim-payout');
      expect(result.functionArgs[0]).toEqual({ type: 'uint', value: 1n });
    });

    it('includes payout post conditions', () => {
      const result = buildClaimPayout(1, 100);
      expect(result.postConditions.length).toBeGreaterThan(0);
    });
  });

  describe('buildSubmitView', () => {
    it('targets stats-tracker.submit-view with campaign and viewer', () => {
      const viewer = 'SP1AAAA111BBB222CCC333DDD444EEE555FFF';
      const result = buildSubmitView(3, viewer);
      expect(result.contractName).toBe(CONTRACTS.STATS_TRACKER);
      expect(result.functionName).toBe('submit-view');
      expect(result.functionArgs).toHaveLength(2);
      expect(result.functionArgs[0]).toEqual({ type: 'uint', value: 3n });
    });
  });

  describe('buildCreateProposal', () => {
    it('converts duration seconds to blocks', () => {
      const sevenDays = 7 * 86400;
      const result = buildCreateProposal({
        title: 'Increase fees',
        description: 'Raise platform fees to 1%',
        duration: sevenDays,
      });
      const expectedBlocks = Math.ceil(sevenDays / BLOCK_TIME.SECONDS_PER_BLOCK);
      expect(result.functionArgs[2]).toEqual({ type: 'uint', value: BigInt(expectedBlocks) });
    });

    it('targets vote-handler.create-proposal', () => {
      const result = buildCreateProposal({
        title: 'Test',
        description: 'Desc',
        duration: 86400,
      });
      expect(result.contractName).toBe(CONTRACTS.VOTE_HANDLER);
      expect(result.functionName).toBe('create-proposal');
    });
  });

  describe('buildCastVote', () => {
    it('passes proposal ID and boolean vote', () => {
      const result = buildCastVote(5, true);
      expect(result.contractName).toBe(CONTRACTS.VOTE_HANDLER);
      expect(result.functionName).toBe('cast-vote');
      expect(result.functionArgs[0]).toEqual({ type: 'uint', value: 5n });
      expect(result.functionArgs[1]).toEqual({ type: 'bool', value: true });
    });

    it('supports voting against', () => {
      const result = buildCastVote(5, false);
      expect(result.functionArgs[1]).toEqual({ type: 'bool', value: false });
    });
  });

  describe('buildReadCampaign', () => {
    it('returns contractId and function for read-only call', () => {
      const result = buildReadCampaign(10);
      expect(result.contractId).toBe(`${CONTRACT_ADDRESS}.${CONTRACTS.PROMO_MANAGER}`);
      expect(result.functionName).toBe('get-campaign');
      expect(result.functionArgs[0]).toEqual({ type: 'uint', value: 10n });
    });
  });

  describe('buildReadAnalytics', () => {
    it('targets stats-tracker.get-analytics', () => {
      const result = buildReadAnalytics(2);
      expect(result.contractId).toContain(CONTRACTS.STATS_TRACKER);
      expect(result.functionName).toBe('get-analytics');
    });
  });

  describe('buildReadUserProfile', () => {
    it('targets user-profiles.get-profile with principal arg', () => {
      const addr = 'SP1AAAA111BBB222CCC333DDD444EEE555FFF';
      const result = buildReadUserProfile(addr);
      expect(result.contractId).toContain(CONTRACTS.USER_PROFILES);
      expect(result.functionName).toBe('get-profile');
      expect(result.functionArgs[0].type).toBe('principal');
    });
  });
});
