'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchContractEvents, type ApiContractEvent } from '@/lib/stacks-api';
import { getContractId, CURRENT_NETWORK, type ContractName } from '@/lib/stacks-config';
import { decodeClarityHex, type DecodedClarityValue } from '@/lib/clarity-decoder';

/** Decoded contract event with parsed Clarity print value. */
export interface ParsedContractEvent {
  txId: string;
  eventIndex: number;
  contractId: string;
  topic: string;
  rawHex: string;
  rawRepr: string;
  decoded: DecodedClarityValue | null;
}

/**
 * Parse raw API contract events into decoded form.
 * Attempts to decode each event's hex value; falls back to null on failure.
 */
function parseEvents(raw: ApiContractEvent[]): ParsedContractEvent[] {
  return raw.map((event) => {
    let decoded: DecodedClarityValue | null = null;
    try {
      decoded = decodeClarityHex(event.contract_log.value.hex);
    } catch {
      // Malformed hex or unknown type prefix - keep raw data available
    }

    return {
      txId: event.tx_id,
      eventIndex: event.event_index,
      contractId: event.contract_log.contract_id,
      topic: event.contract_log.topic,
      rawHex: event.contract_log.value.hex,
      rawRepr: event.contract_log.value.repr,
      decoded,
    };
  });
}

interface UseContractEventsOptions {
  contractName: ContractName;
  limit?: number;
  offset?: number;
  /** Poll interval in ms for live event feed (default: off). */
  refetchInterval?: number | false;
  enabled?: boolean;
}

/**
 * Hook to fetch and decode contract print events.
 * Useful for building activity feeds, audit logs, and real-time
 * dashboards from on-chain contract emit events.
 *
 * @example
 * const { data: events } = useContractEvents({
 *   contractName: 'promo-manager',
 *   limit: 10,
 *   refetchInterval: 30_000,
 * });
 */
export function useContractEvents({
  contractName,
  limit = 20,
  offset = 0,
  refetchInterval,
  enabled = true,
}: UseContractEventsOptions) {
  const contractId = getContractId(contractName);

  return useQuery({
    queryKey: ['contract-events', CURRENT_NETWORK, contractId, limit, offset],
    queryFn: async () => {
      const result = await fetchContractEvents(contractId, limit, offset);
      if (result.ok && result.data) {
        return {
          events: parseEvents(result.data.results),
          total: result.data.results.length,
          limit: result.data.limit,
          offset: result.data.offset,
        };
      }
      throw new Error(result.error || 'Failed to fetch contract events');
    },
    enabled,
    staleTime: 15_000,
    refetchInterval: refetchInterval || undefined,
  });
}

/**
 * Hook to fetch events for a specific contract, filtered by a
 * decoded tuple field value. Performs client-side filtering since
 * the Hiro API doesn't support event-level filters.
 *
 * @example
 * const { data } = useFilteredContractEvents({
 *   contractName: 'promo-manager',
 *   filterField: 'campaign-id',
 *   filterValue: 5,
 *   limit: 50,
 * });
 */
export function useFilteredContractEvents({
  contractName,
  filterField,
  filterValue,
  limit = 50,
  enabled = true,
}: {
  contractName: ContractName;
  filterField: string;
  filterValue: unknown;
  limit?: number;
  enabled?: boolean;
}) {
  const contractId = getContractId(contractName);

  return useQuery({
    queryKey: ['contract-events-filtered', CURRENT_NETWORK, contractId, filterField, String(filterValue), limit],
    queryFn: async () => {
      const result = await fetchContractEvents(contractId, limit, 0);
      if (!result.ok || !result.data) {
        throw new Error(result.error || 'Failed to fetch contract events');
      }

      const parsed = parseEvents(result.data.results);

      // Filter events whose decoded tuple has the matching field value
      return parsed.filter((event) => {
        if (!event.decoded || event.decoded.type !== 'tuple') return false;
        const field = event.decoded.value[filterField];
        if (!field) return false;

        if (field.type === 'uint' || field.type === 'int') {
          return Number(field.value) === Number(filterValue);
        }
        if (field.type === 'string-ascii' || field.type === 'string-utf8') {
          return field.value === String(filterValue);
        }
        if (field.type === 'principal') {
          return field.value === String(filterValue);
        }
        return false;
      });
    },
    enabled,
    staleTime: 30_000,
  });
}

/**
 * Invalidate cached contract events (e.g., after a write transaction).
 * Call this from mutation onSuccess callbacks to refresh event feeds.
 */
export function useInvalidateContractEvents() {
  const queryClient = useQueryClient();

  return (contractName?: ContractName) => {
    if (contractName) {
      const contractId = getContractId(contractName);
      queryClient.invalidateQueries({
        queryKey: ['contract-events', CURRENT_NETWORK, contractId],
      });
      queryClient.invalidateQueries({
        queryKey: ['contract-events-filtered', CURRENT_NETWORK, contractId],
      });
    } else {
      // Invalidate all contract event queries
      queryClient.invalidateQueries({
        queryKey: ['contract-events'],
      });
      queryClient.invalidateQueries({
        queryKey: ['contract-events-filtered'],
      });
    }
  };
}
