// Clarity v4 Map Data Type Utilities

export type ClarityMap<K, V> = { type: 'map'; entries: Map<string, V>; keySerializer: (k: K) => string };
