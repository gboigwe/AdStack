/**
 * Display Utilities for Stacks.js v7+
 * Formatting helpers for UI display
 */

/**
 * Truncate Stacks address for display
 * @example SP2...XYZ9
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format micro-STX to STX with decimals
 * @param microStx - Amount in micro-STX (1 STX = 1,000,000 micro-STX)
 * @param decimals - Number of decimal places (default: 6)
 * @returns Formatted STX amount
 */
export function formatSTX(microStx: bigint | number, decimals: number = 6): string {
  const MICRO_STX = 1_000_000;
  const amount = typeof microStx === 'bigint' ? Number(microStx) : microStx;
  const stx = amount / MICRO_STX;

  return stx.toFixed(decimals);
}

/**
 * Format STX amount with symbol
 * @example "1.500000 STX"
 */
export function formatSTXWithSymbol(microStx: bigint | number, decimals: number = 6): string {
  return `${formatSTX(microStx, decimals)} STX`;
}

/**
 * Format large numbers with K, M, B suffixes
 * @example 1500 -> "1.5K", 1500000 -> "1.5M"
 */
export function formatCompactNumber(num: number | bigint): string {
  const value = typeof num === 'bigint' ? Number(num) : num;

  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Format Unix timestamp to readable date
 * @param timestamp - Unix timestamp in seconds (from stacks-block-time)
 * @param options - Intl.DateTimeFormat options
 */
export function formatTimestamp(
  timestamp: number,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };

  return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
}

/**
 * Format Unix timestamp to relative time
 * @example "2 hours ago", "in 3 days"
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const date = new Date(timestamp * 1000);
  const diffMs = date.getTime() - now;
  const diffSec = Math.floor(Math.abs(diffMs) / 1000);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (diffSec < 60) {
    return rtf.format(diffMs < 0 ? -diffSec : diffSec, 'second');
  } else if (diffSec < 3600) {
    const minutes = Math.floor(diffSec / 60);
    return rtf.format(diffMs < 0 ? -minutes : minutes, 'minute');
  } else if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return rtf.format(diffMs < 0 ? -hours : hours, 'hour');
  } else if (diffSec < 604800) {
    const days = Math.floor(diffSec / 86400);
    return rtf.format(diffMs < 0 ? -days : days, 'day');
  } else if (diffSec < 2592000) {
    const weeks = Math.floor(diffSec / 604800);
    return rtf.format(diffMs < 0 ? -weeks : weeks, 'week');
  } else {
    const months = Math.floor(diffSec / 2592000);
    return rtf.format(diffMs < 0 ? -months : months, 'month');
  }
}

/**
 * Format transaction ID for display
 * @example 0x1234...5678
 */
export function formatTxId(txId: string, startChars: number = 8, endChars: number = 4): string {
  if (!txId || txId.length <= startChars + endChars) {
    return txId;
  }

  // Ensure 0x prefix
  const formatted = txId.startsWith('0x') ? txId : `0x${txId}`;
  return `${formatted.slice(0, startChars + 2)}...${formatted.slice(-endChars)}`;
}

/**
 * Format percentage
 * @example 0.1234 -> "12.34%"
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format duration in seconds to human-readable string
 * @example 3665 -> "1h 1m 5s"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Format block height to estimate date
 * Note: Stacks blocks are ~10 minutes apart
 */
export function estimateBlockDate(blockHeight: number, currentBlock: number): Date {
  const blockDiff = blockHeight - currentBlock;
  const minutesDiff = blockDiff * 10; // ~10 minutes per block
  const msDiff = minutesDiff * 60 * 1000;

  return new Date(Date.now() + msDiff);
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when copy succeeds
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Format campaign status for display
 */
export function formatCampaignStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: 'Draft',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return statusMap[status.toLowerCase()] || status;
}

/**
 * Get status color class for Tailwind
 */
export function getStatusColorClass(status: string): string {
  const colorMap: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return colorMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
}
