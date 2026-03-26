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
