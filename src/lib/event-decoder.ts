/**
 * event-decoder.ts
 * Decode Clarity print events emitted by AdStack contracts.
 * Parses the hex-encoded Clarity values from Hiro API contract_log events
 * into typed TypeScript objects.
 */

import type { ContractEvent } from './hiro-api';
import type {
  OnChainCampaignCreatedEvent,
  OnChainEscrowCreatedEvent,
  OnChainFundsReleasedEvent,
  OnChainFundsRefundedEvent,
  OnChainPayoutClaimedEvent,
  OnChainSpendRecordedEvent,
  OnChainAdStackEvent,
} from '@/types/contracts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DecodedEvent<T = OnChainAdStackEvent> {
  raw: ContractEvent;
  txId: string;
  event: T;
  contractId: string;
  blockTime?: number;
}

// ---------------------------------------------------------------------------
// Hex Clarity Tuple Decoder
// ---------------------------------------------------------------------------

/**
 * Parse the `repr` string from a Clarity print event into a key-value map.
 * Clarity repr format: (tuple (key1 value1) (key2 value2) ...)
 */
export function parseClarityRepr(repr: string): Record<string, string> {
  const result: Record<string, string> = {};

  // Remove outer (tuple ...) wrapper
  const inner = repr.replace(/^\(tuple\s+/, '').replace(/\)$/, '');

  // Match key-value pairs: (key value)
  const pairs = inner.match(/\([\w-]+\s+[^()]*\)/g) ?? [];

  for (const pair of pairs) {
    const trimmed = pair.slice(1, -1); // remove outer parens
    const spaceIdx = trimmed.indexOf(' ');
    if (spaceIdx === -1) continue;
    const key = trimmed.slice(0, spaceIdx);
    const value = trimmed.slice(spaceIdx + 1).trim();
    result[key] = value;
  }

  return result;
}

/**
 * Parse a Clarity uint from repr string (e.g. "u1234" -> 1234n)
 */
function parseUint(s: string): bigint {
  return BigInt(s.replace(/^u/, ''));
}

/**
 * Parse a Clarity principal from repr (removes 'SP...' or wraps).
 */
function parsePrincipal(s: string): string {
  return s.replace(/^'/, '');
}

// ---------------------------------------------------------------------------
// Event Decoders
// ---------------------------------------------------------------------------

function decodeCampaignCreated(
  kv: Record<string, string>,
): OnChainCampaignCreatedEvent {
  return {
    event: 'campaign-created',
    'campaign-id': parseUint(kv['campaign-id'] ?? 'u0'),
    advertiser: parsePrincipal(kv['advertiser'] ?? ''),
    budget: parseUint(kv['budget'] ?? 'u0'),
    duration: parseUint(kv['duration'] ?? 'u0'),
    timestamp: parseUint(kv['timestamp'] ?? 'u0'),
  };
}

function decodeEscrowCreated(
  kv: Record<string, string>,
): OnChainEscrowCreatedEvent {
  return {
    event: 'escrow-created',
    'campaign-id': parseUint(kv['campaign-id'] ?? 'u0'),
    advertiser: parsePrincipal(kv['advertiser'] ?? ''),
    amount: parseUint(kv['amount'] ?? 'u0'),
    timestamp: parseUint(kv['timestamp'] ?? 'u0'),
  };
}

function decodeFundsReleased(
  kv: Record<string, string>,
): OnChainFundsReleasedEvent {
  return {
    event: 'funds-released',
    'campaign-id': parseUint(kv['campaign-id'] ?? 'u0'),
    publisher: parsePrincipal(kv['publisher'] ?? ''),
    amount: parseUint(kv['amount'] ?? 'u0'),
    timestamp: parseUint(kv['timestamp'] ?? 'u0'),
  };
}

function decodeFundsRefunded(
  kv: Record<string, string>,
): OnChainFundsRefundedEvent {
  return {
    event: 'funds-refunded',
    'campaign-id': parseUint(kv['campaign-id'] ?? 'u0'),
    advertiser: parsePrincipal(kv['advertiser'] ?? ''),
    amount: parseUint(kv['amount'] ?? 'u0'),
    timestamp: parseUint(kv['timestamp'] ?? 'u0'),
  };
}

function decodePayoutClaimed(
  kv: Record<string, string>,
): OnChainPayoutClaimedEvent {
  return {
    event: 'payout-claimed',
    'payout-id': parseUint(kv['payout-id'] ?? 'u0'),
    publisher: parsePrincipal(kv['publisher'] ?? ''),
    'campaign-id': parseUint(kv['campaign-id'] ?? 'u0'),
    amount: parseUint(kv['amount'] ?? 'u0'),
    timestamp: parseUint(kv['timestamp'] ?? 'u0'),
  };
}

function decodeSpendRecorded(
  kv: Record<string, string>,
): OnChainSpendRecordedEvent {
  return {
    event: 'spend-recorded',
    'campaign-id': parseUint(kv['campaign-id'] ?? 'u0'),
    amount: parseUint(kv['amount'] ?? 'u0'),
    timestamp: parseUint(kv['timestamp'] ?? 'u0'),
  };
}

// ---------------------------------------------------------------------------
// Main Decoder
// ---------------------------------------------------------------------------

const EVENT_DECODERS: Record<string, (kv: Record<string, string>) => OnChainAdStackEvent> = {
  'campaign-created': decodeCampaignCreated,
  'escrow-created': decodeEscrowCreated,
  'funds-released': decodeFundsReleased,
  'funds-refunded': decodeFundsRefunded,
  'payout-claimed': decodePayoutClaimed,
  'spend-recorded': decodeSpendRecorded,
};

/**
 * Decode a raw Hiro API contract_log event into a typed AdStack event.
 * Returns null if the event is not a recognized AdStack print event.
 */
export function decodeAdStackEvent(
  raw: ContractEvent,
): DecodedEvent | null {
  if (!raw.contract_log) return null;

  const repr = raw.contract_log.value.repr;
  const kv = parseClarityRepr(repr);
  const eventName = kv['event']?.replace(/^"/, '').replace(/"$/, '');

  if (!eventName || !EVENT_DECODERS[eventName]) return null;

  const decoder = EVENT_DECODERS[eventName];
  const event = decoder(kv);

  return {
    raw,
    txId: raw.tx_id,
    event,
    contractId: raw.contract_log.contract_id,
    blockTime: kv['timestamp'] ? Number(parseUint(kv['timestamp'])) : undefined,
  };
}

/**
 * Decode a list of contract events, filtering to recognized AdStack events.
 */
export function decodeAdStackEvents(
  events: ContractEvent[],
): DecodedEvent[] {
  return events
    .map(decodeAdStackEvent)
    .filter((e): e is DecodedEvent => e !== null);
}
