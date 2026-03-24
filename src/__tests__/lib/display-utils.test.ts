import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  truncateAddress,
  formatSTX,
  formatSTXWithSymbol,
  formatCompactNumber,
  formatTimestamp,
  formatRelativeTime,
  formatTxId,
  formatPercentage,
  formatDuration,
  estimateBlockDate,
  copyToClipboard,
  formatFee,
  formatCampaignStatus,
  getStatusColorClass,
  formatNumber,
  pluralize,
  formatPrincipal,
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

  it('includes dark mode classes', () => {
    expect(getStatusColorClass('active')).toContain('dark:');
  });

  it('returns gray fallback for unknown', () => {
    expect(getStatusColorClass('unknown')).toContain('gray');
  });
});

describe('formatNumber', () => {
  it('formats with commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('handles BigInt', () => {
    expect(formatNumber(1000n)).toBe('1,000');
  });

  it('handles small numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('pluralize', () => {
  it('uses singular for count 1', () => {
    expect(pluralize(1, 'block')).toBe('1 block');
  });

  it('uses default plural for count > 1', () => {
    expect(pluralize(5, 'block')).toBe('5 blocks');
  });

  it('uses plural for count 0', () => {
    expect(pluralize(0, 'block')).toBe('0 blocks');
  });

  it('accepts custom plural form', () => {
    expect(pluralize(2, 'child', 'children')).toBe('2 children');
  });

  it('formats count with commas', () => {
    expect(pluralize(1000, 'item')).toBe('1,000 items');
  });
});

describe('formatTimestamp', () => {
  it('formats a Unix timestamp to a readable date', () => {
    // 2024-01-15 12:00:00 UTC = 1705320000
    const result = formatTimestamp(1705320000);
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('accepts custom Intl options', () => {
    const result = formatTimestamp(1705320000, { year: 'numeric', month: 'long' });
    expect(result).toContain('January');
    expect(result).toContain('2024');
  });

  it('includes time by default', () => {
    const result = formatTimestamp(1705320000);
    // Default options include hour and minute
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats seconds ago', () => {
    const thirtySecondsAgo = Math.floor(Date.now() / 1000) - 30;
    const result = formatRelativeTime(thirtySecondsAgo);
    expect(result).toContain('30 seconds ago');
  });

  it('formats minutes ago', () => {
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
    const result = formatRelativeTime(fiveMinutesAgo);
    expect(result).toContain('5 minutes ago');
  });

  it('formats hours ago', () => {
    const twoHoursAgo = Math.floor(Date.now() / 1000) - 7200;
    const result = formatRelativeTime(twoHoursAgo);
    expect(result).toContain('2 hours ago');
  });

  it('formats days ago', () => {
    const threeDaysAgo = Math.floor(Date.now() / 1000) - 259200;
    const result = formatRelativeTime(threeDaysAgo);
    expect(result).toContain('3 days ago');
  });

  it('formats weeks ago', () => {
    const twoWeeksAgo = Math.floor(Date.now() / 1000) - 1209600;
    const result = formatRelativeTime(twoWeeksAgo);
    expect(result).toContain('2 weeks ago');
  });

  it('formats future timestamps', () => {
    const inTwoHours = Math.floor(Date.now() / 1000) + 7200;
    const result = formatRelativeTime(inTwoHours);
    expect(result).toContain('in 2 hours');
  });
});

describe('estimateBlockDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('estimates a future block date', () => {
    const result = estimateBlockDate(1006, 1000);
    // 6 blocks × 10 min = 60 min in the future
    const expected = new Date('2026-03-16T13:00:00Z');
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('estimates a past block date', () => {
    const result = estimateBlockDate(994, 1000);
    // -6 blocks × 10 min = 60 min in the past
    const expected = new Date('2026-03-16T11:00:00Z');
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('returns now for same block height', () => {
    const result = estimateBlockDate(1000, 1000);
    expect(result.getTime()).toBe(Date.now());
  });
});

describe('copyToClipboard', () => {
  it('returns true on successful copy', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const result = await copyToClipboard('hello');
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
  });

  it('returns false when clipboard fails', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('fail')) },
    });
    const result = await copyToClipboard('hello');
    expect(result).toBe(false);
  });
});

describe('formatPrincipal', () => {
  it('truncates address-only principal', () => {
    const addr = 'SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD';
    expect(formatPrincipal(addr)).toBe('SP3B...4EAD');
  });

  it('preserves contract name after truncated address', () => {
    const principal = 'SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD.promo-manager';
    const result = formatPrincipal(principal);
    expect(result).toContain('.promo-manager');
    expect(result).toContain('...');
  });

  it('handles short address with contract', () => {
    expect(formatPrincipal('SP12.token')).toBe('SP12.token');
  });
});
