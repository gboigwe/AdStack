// Clarity v4 Storage Pattern Helpers

export type MapKey<K> = { serialize: (k: K) => string; deserialize: (s: string) => K };

export type StorageMap<K, V> = {
  name: string;
  keyType: string;
  valueType: string;
  entries: Map<string, V>;
};

export type StorageDataVar<T> = { name: string; valueType: string; value: T };

export function makeStorageMap<K, V>(name: string, keyType: string, valueType: string): StorageMap<K, V> {
  return { name, keyType, valueType, entries: new Map() };
}

export function storageMapGet<K, V>(map: StorageMap<K, V>, key: K): V | null {
  return map.entries.get(JSON.stringify(key)) ?? null;
}

export function storageMapSet<K, V>(map: StorageMap<K, V>, key: K, value: V): StorageMap<K, V> {
  const newEntries = new Map(map.entries);
  newEntries.set(JSON.stringify(key), value);
  return { ...map, entries: newEntries };
}

export function storageMapDelete<K, V>(map: StorageMap<K, V>, key: K): StorageMap<K, V> {
  const newEntries = new Map(map.entries);
  newEntries.delete(JSON.stringify(key));
  return { ...map, entries: newEntries };
}

export function storageMapHas<K, V>(map: StorageMap<K, V>, key: K): boolean {
  return map.entries.has(JSON.stringify(key));
}

export function makeStorageDataVar<T>(name: string, valueType: string, initial: T): StorageDataVar<T> {
  return { name, valueType, value: initial };
}

export function dataVarGet<T>(v: StorageDataVar<T>): T {
  return v.value;
}

export function dataVarSet<T>(v: StorageDataVar<T>, value: T): StorageDataVar<T> {
  return { ...v, value };
}

export type CampaignKey = { advertiser: string; campaignId: bigint };
export type PublisherKey = { publisher: string };
export type ProposalKey = { proposalId: bigint };

export function campaignKeyToString(key: CampaignKey): string {
  return `${key.advertiser}:${key.campaignId}`;
}

export function publisherKeyToString(key: PublisherKey): string {
  return key.publisher;
}

export function proposalKeyToString(key: ProposalKey): string {
  return key.proposalId.toString();
}

export type StorageStats = {
  mapCount: number;
  dataVarCount: number;
  totalEntries: number;
};

export function calculateStorageStats(
  maps: StorageMap<unknown, unknown>[],
  vars: StorageDataVar<unknown>[]
): StorageStats {
  const totalEntries = maps.reduce((sum, m) => sum + m.entries.size, 0);
  return {
    mapCount: maps.length,
    dataVarCount: vars.length,
    totalEntries,
  };
}

export function storageMapSize<K, V>(map: StorageMap<K, V>): number {
  return map.entries.size;
}

export function storageMapClear<K, V>(map: StorageMap<K, V>): StorageMap<K, V> {
  return { ...map, entries: new Map() };
}

export function storageMapToObject<K, V>(map: StorageMap<K, V>): Record<string, V> {
  const result: Record<string, V> = {};
  for (const [k, v] of map.entries) {
    result[k] = v;
  }
  return result;
}

export function storageMapKeys<K, V>(map: StorageMap<K, V>): string[] {
  return Array.from(map.entries.keys());
}

export function storageMapValues<K, V>(map: StorageMap<K, V>): V[] {
  return Array.from(map.entries.values());
}

export function storageMapUpdate<K, V>(
  map: StorageMap<K, V>,
  key: K,
  fn: (current: V | null) => V
): StorageMap<K, V> {
  const current = storageMapGet(map, key);
  return storageMapSet(map, key, fn(current));
}

export function storageMapFilter<K, V>(
  map: StorageMap<K, V>,
  predicate: (value: V) => boolean
): StorageMap<K, V> {
  const filtered = new Map<string, V>();
  for (const [k, v] of map.entries) {
    if (predicate(v)) filtered.set(k, v);
  }
  return { ...map, entries: filtered };
}

// Additional map pattern utility 1
export const STORAGE_PATTERN_VERSION_1 = '1.0.0';

// Additional map pattern utility 2
export const STORAGE_PATTERN_VERSION_2 = '2.0.0';

// Additional map pattern utility 3
export const STORAGE_PATTERN_VERSION_3 = '3.0.0';
