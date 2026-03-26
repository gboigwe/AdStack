// Clarity v4 Storage Pattern Helpers

export type MapKey<K> = { serialize: (k: K) => string; deserialize: (s: string) => K };

export type StorageMap<K, V> = {
  name: string;
  keyType: string;
  valueType: string;
  entries: Map<string, V>;
};
