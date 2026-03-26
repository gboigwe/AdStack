// Clarity v4 Storage Pattern Helpers

export type MapKey<K> = { serialize: (k: K) => string; deserialize: (s: string) => K };
