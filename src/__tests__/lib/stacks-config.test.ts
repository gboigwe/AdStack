import { describe, it, expect } from 'vitest';
import {
  CONTRACTS,
  CONTRACT_ADDRESS,
  BLOCK_TIME,
  MICRO_STX,
  microStxToStx,
  stxToMicroStx,
  getContractId,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from '@/lib/stacks-config';

describe('stacks-config', () => {
  describe('CONTRACTS', () => {
    it('contains expected contract names', () => {
      expect(CONTRACTS.PROMO_MANAGER).toBe('promo-manager');
      expect(CONTRACTS.USER_PROFILES).toBe('user-profiles');
      expect(CONTRACTS.VOTE_HANDLER).toBe('vote-handler');
      expect(CONTRACTS.STATS_TRACKER).toBe('stats-tracker');
      expect(CONTRACTS.CASH_DISTRIBUTOR).toBe('cash-distributor');
      expect(CONTRACTS.FUNDS_KEEPER).toBe('funds-keeper');
    });
  });

  describe('BLOCK_TIME', () => {
    it('has consistent values', () => {
      expect(BLOCK_TIME.SECONDS_PER_BLOCK).toBe(600);
      expect(BLOCK_TIME.BLOCKS_PER_DAY).toBe(144);
      expect(BLOCK_TIME.SECONDS_PER_DAY).toBe(86400);
      // Consistency check: blocks_per_day * seconds_per_block ≈ seconds_per_day
      expect(BLOCK_TIME.BLOCKS_PER_DAY * BLOCK_TIME.SECONDS_PER_BLOCK).toBe(
        BLOCK_TIME.SECONDS_PER_DAY,
      );
    });
  });

  describe('MICRO_STX', () => {
    it('equals 1,000,000', () => {
      expect(MICRO_STX).toBe(1_000_000);
    });
  });

  describe('microStxToStx', () => {
    it('converts micro-STX to STX', () => {
      expect(microStxToStx(1_000_000)).toBe(1);
      expect(microStxToStx(500_000)).toBe(0.5);
      expect(microStxToStx(0)).toBe(0);
    });

    it('handles bigint input', () => {
      expect(microStxToStx(2_500_000n)).toBe(2.5);
    });
  });

  describe('stxToMicroStx', () => {
    it('converts STX to micro-STX as bigint', () => {
      expect(stxToMicroStx(1)).toBe(1_000_000n);
      expect(stxToMicroStx(0.5)).toBe(500_000n);
      expect(stxToMicroStx(0)).toBe(0n);
    });

    it('floors fractional micro-STX', () => {
      // 1.0000001 STX = 1_000_000.1 micro-STX → floors to 1_000_000
      expect(stxToMicroStx(1.0000001)).toBe(1_000_000n);
    });
  });

  describe('getContractId', () => {
    it('joins address and contract name', () => {
      const id = getContractId(CONTRACTS.PROMO_MANAGER);
      expect(id).toBe(`${CONTRACT_ADDRESS}.promo-manager`);
    });
  });

  describe('getExplorerTxUrl', () => {
    it('generates an explorer URL for a tx id', () => {
      const url = getExplorerTxUrl('0xabc123');
      expect(url).toContain('explorer.hiro.so/txid/0xabc123');
    });
  });

  describe('getExplorerAddressUrl', () => {
    it('generates an explorer URL for an address', () => {
      const url = getExplorerAddressUrl('SP3BXJ');
      expect(url).toContain('explorer.hiro.so/address/SP3BXJ');
    });
  });
});
