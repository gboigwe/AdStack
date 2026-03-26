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
