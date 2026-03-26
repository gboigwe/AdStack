// Clarity v4 Map Data Type Utilities

export type ClarityMap<K, V> = { type: 'map'; entries: Map<string, V>; keySerializer: (k: K) => string };

export type MapEntry<K, V> = { key: K; value: V };

export function makeMap<K, V>(keySerializer: (k: K) => string): ClarityMap<K, V> {
  return { type: 'map', entries: new Map(), keySerializer };
}

export function mapInsert<K, V>(m: ClarityMap<K, V>, key: K, value: V): ClarityMap<K, V> {
  const newEntries = new Map(m.entries);
  newEntries.set(m.keySerializer(key), value);
  return { ...m, entries: newEntries };
}

export function mapGet<K, V>(m: ClarityMap<K, V>, key: K): V | null {
  return m.entries.get(m.keySerializer(key)) ?? null;
}

export function mapDelete<K, V>(m: ClarityMap<K, V>, key: K): ClarityMap<K, V> {
  const newEntries = new Map(m.entries);
  newEntries.delete(m.keySerializer(key));
  return { ...m, entries: newEntries };
}

export function mapHas<K, V>(m: ClarityMap<K, V>, key: K): boolean {
  return m.entries.has(m.keySerializer(key));
}

export function mapSize<K, V>(m: ClarityMap<K, V>): number {
  return m.entries.size;
}

export function mapKeys<K, V>(m: ClarityMap<K, V>): string[] {
  return Array.from(m.entries.keys());
}

export function mapValues<K, V>(m: ClarityMap<K, V>): V[] {
  return Array.from(m.entries.values());
}

export function mapToEntries<K, V>(m: ClarityMap<K, V>): [string, V][] {
  return Array.from(m.entries.entries());
}

export function mapMerge<K, V>(a: ClarityMap<K, V>, b: ClarityMap<K, V>): ClarityMap<K, V> {
  const merged = new Map([...a.entries, ...b.entries]);
  return { ...a, entries: merged };
}

export function mapIsEmpty<K, V>(m: ClarityMap<K, V>): boolean {
  return m.entries.size === 0;
}

export function mapClear<K, V>(m: ClarityMap<K, V>): ClarityMap<K, V> {
  return { ...m, entries: new Map() };
}

export function mapFilter<K, V>(m: ClarityMap<K, V>, predicate: (key: string, value: V) => boolean): ClarityMap<K, V> {
  const filtered = new Map<string, V>();
  for (const [k, v] of m.entries) {
    if (predicate(k, v)) filtered.set(k, v);
  }
  return { ...m, entries: filtered };
}
