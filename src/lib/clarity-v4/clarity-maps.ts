// Clarity v4 Map Data Type Utilities

export type ClarityMap<K, V> = { type: 'map'; entries: Map<string, V>; keySerializer: (k: K) => string };

export type MapEntry<K, V> = { key: K; value: V };

export function makeMap<K, V>(keySerializer: (k: K) => string): ClarityMap<K, V> {
  return { type: 'map', entries: new Map(), keySerializer };
}
