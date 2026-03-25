/**
 * stacks-indexer.ts
 * Event indexer for AdStack on-chain events.
 * Maintains an in-memory index of decoded contract events
 * grouped by campaign ID, publisher, and event type.
 * Designed to be hydrated from the Hiro API on app load.
 */

import { fetchContractEvents } from './hiro-api';
import { decodeAdStackEvents, DecodedEvent } from './event-decoder';
import { CONTRACT_ADDRESS, CONTRACTS } from './stacks-config';
import type { ContractName } from './stacks-config';
import { SupportedNetwork } from './stacks-network';

// ---------------------------------------------------------------------------
// Index Structure
// ---------------------------------------------------------------------------

export interface EventIndex {
  /** All decoded events, sorted newest first */
  allEvents: DecodedEvent[];
  /** Events grouped by campaign ID */
  byCampaign: Map<number, DecodedEvent[]>;
  /** Events grouped by event type */
  byType: Map<string, DecodedEvent[]>;
  /** Last sync time (Unix ms) */
  lastSyncAt: number;
  /** Total event count */
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Global Index (singleton per module)
// ---------------------------------------------------------------------------

let globalIndex: EventIndex = {
  allEvents: [],
  byCampaign: new Map(),
  byType: new Map(),
  lastSyncAt: 0,
  totalCount: 0,
};

// ---------------------------------------------------------------------------
// Indexing Functions
// ---------------------------------------------------------------------------

/**
 * Add a decoded event to the index.
 */
function indexEvent(event: DecodedEvent): void {
  globalIndex.allEvents.unshift(event);

  // Index by campaign ID
  const campaignId = Number((event.event as any)['campaign-id'] ?? -1);
  if (campaignId >= 0) {
    const existing = globalIndex.byCampaign.get(campaignId) ?? [];
    existing.push(event);
    globalIndex.byCampaign.set(campaignId, existing);
  }

  // Index by event type
  const eventType = event.event.event;
  const typeEvents = globalIndex.byType.get(eventType) ?? [];
  typeEvents.push(event);
  globalIndex.byType.set(eventType, typeEvents);

  globalIndex.totalCount++;
}

/**
 * Sync the index with on-chain events from a contract.
 */
async function syncContract(
  contractName: ContractName | string,
  limit: number,
  network?: SupportedNetwork,
): Promise<number> {
  const contractId = `${CONTRACT_ADDRESS}.${contractName}`;
  const data = await fetchContractEvents(contractId, { limit, network });

  const decoded = decodeAdStackEvents(data.results ?? []);
  for (const event of decoded) {
    indexEvent(event);
  }

  return decoded.length;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize the event index by syncing all AdStack contracts.
 * Call this once on app startup or after wallet connection.
 */
export async function initEventIndex(
  limit = 100,
  network?: SupportedNetwork,
): Promise<EventIndex> {
  const contractsToSync: Array<ContractName | string> = [
    CONTRACTS.PROMO_MANAGER,
    CONTRACTS.FUNDS_KEEPER,
    CONTRACTS.CASH_DISTRIBUTOR,
    CONTRACTS.STATS_TRACKER,
  ];

  await Promise.allSettled(
    contractsToSync.map((c) => syncContract(c, limit, network)),
  );

  // Sort all events by event_index descending (newest first)
  globalIndex.allEvents.sort(
    (a, b) => b.raw.event_index - a.raw.event_index,
  );

  globalIndex.lastSyncAt = Date.now();
  return globalIndex;
}

/**
 * Get the current event index state.
 */
export function getEventIndex(): EventIndex {
  return globalIndex;
}

/**
 * Get events for a specific campaign ID.
 */
export function getCampaignEvents(campaignId: number): DecodedEvent[] {
  return globalIndex.byCampaign.get(campaignId) ?? [];
}

/**
 * Get events of a specific type.
 */
export function getEventsByType(eventType: string): DecodedEvent[] {
  return globalIndex.byType.get(eventType) ?? [];
}

/**
 * Reset the global event index.
 */
export function resetEventIndex(): void {
  globalIndex = {
    allEvents: [],
    byCampaign: new Map(),
    byType: new Map(),
    lastSyncAt: 0,
    totalCount: 0,
  };
}
