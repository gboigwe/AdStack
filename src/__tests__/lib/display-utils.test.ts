import { describe, it, expect } from 'vitest';
import {
  truncateAddress,
  formatSTX,
  formatSTXWithSymbol,
  formatCompactNumber,
  formatTxId,
  formatPercentage,
  formatDuration,
  formatFee,
  formatCampaignStatus,
  getStatusColorClass,
} from '@/lib/display-utils';

describe('truncateAddress', () => {
  it('truncates a long address', () => {
    const addr = 'SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD';
    expect(truncateAddress(addr)).toBe('SP3BXJ...4EAD');
  });

  it('returns short address unchanged', () => {
    expect(truncateAddress('SP3BXJ')).toBe('SP3BXJ');
  });

  it('handles empty string', () => {
    expect(truncateAddress('')).toBe('');
  });

  it('accepts custom start/end chars', () => {
    const addr = 'SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD';
    expect(truncateAddress(addr, 4, 6)).toBe('SP3B...T84EAD');
  });
});

describe('formatSTX', () => {
  it('formats micro-STX to STX', () => {
    expect(formatSTX(1_000_000n)).toBe('1.000000');
  });

  it('formats zero', () => {
    expect(formatSTX(0n)).toBe('0.000000');
  });

  it('formats with custom decimals', () => {
    expect(formatSTX(1_500_000n, 2)).toBe('1.50');
  });

  it('handles large values via BigInt', () => {
    expect(formatSTX(100_000_000_000n, 2)).toBe('100000.00');
  });

  it('handles negative values', () => {
    expect(formatSTX(-2_500_000n, 2)).toBe('-2.50');
  });

  it('formats zero decimals', () => {
    expect(formatSTX(3_000_000n, 0)).toBe('3');
  });

  it('accepts number input', () => {
    expect(formatSTX(1_000_000, 2)).toBe('1.00');
  });
});

describe('formatSTXWithSymbol', () => {
  it('appends STX symbol', () => {
    expect(formatSTXWithSymbol(1_000_000n, 2)).toBe('1.00 STX');
  });
});

describe('formatCompactNumber', () => {
  it('returns small numbers as-is', () => {
    expect(formatCompactNumber(42)).toBe('42');
  });

  it('formats thousands', () => {
    expect(formatCompactNumber(1500)).toBe('1.5K');
  });

  it('formats millions', () => {
    expect(formatCompactNumber(2_500_000)).toBe('2.5M');
  });

  it('formats billions', () => {
    expect(formatCompactNumber(3_000_000_000)).toBe('3.0B');
  });

  it('handles BigInt input', () => {
    expect(formatCompactNumber(10_000n)).toBe('10.0K');
  });
});

describe('formatTxId', () => {
  it('truncates a hex tx ID', () => {
    const txId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    expect(formatTxId(txId)).toBe('0x12345678...cdef');
  });

  it('adds 0x prefix when missing', () => {
    const txId = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    expect(formatTxId(txId)).toBe('0x12345678...cdef');
  });

  it('returns short IDs unchanged', () => {
    expect(formatTxId('0x1234')).toBe('0x1234');
  });
});

describe('formatPercentage', () => {
  it('formats decimal to percentage', () => {
    expect(formatPercentage(0.1234)).toBe('12.34%');
  });

  it('formats with custom decimals', () => {
    expect(formatPercentage(0.5, 0)).toBe('50%');
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });

  it('formats hours', () => {
    expect(formatDuration(3665)).toBe('1h 1m 5s');
  });

  it('formats days', () => {
    expect(formatDuration(90000)).toBe('1d 1h');
  });

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('handles negative values', () => {
    expect(formatDuration(-60)).toBe('-1m');
  });
});

describe('formatFee', () => {
  it('formats micro-STX fee to STX', () => {
    expect(formatFee('2500')).toBe('0.0025 STX');
  });

  it('handles zero fee', () => {
    expect(formatFee('0')).toBe('0 STX');
  });

  it('handles empty string', () => {
    expect(formatFee('')).toBe('0 STX');
  });
});

describe('formatCampaignStatus', () => {
  it('capitalizes known statuses', () => {
    expect(formatCampaignStatus('active')).toBe('Active');
    expect(formatCampaignStatus('paused')).toBe('Paused');
    expect(formatCampaignStatus('completed')).toBe('Completed');
  });

  it('returns unknown statuses as-is', () => {
    expect(formatCampaignStatus('unknown')).toBe('unknown');
  });
});

describe('getStatusColorClass', () => {
  it('returns green for active', () => {
    expect(getStatusColorClass('active')).toContain('green');
  });

  it('returns gray fallback for unknown', () => {
    expect(getStatusColorClass('unknown')).toContain('gray');
  });
});
