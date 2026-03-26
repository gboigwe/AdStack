// Clarity v4 Tuple Builders and Merge Utilities

export type ClarityTuple<T extends Record<string, unknown> = Record<string, unknown>> = {
  type: 'tuple';
  data: T;
};

export type TupleKey = string;
export type TupleValue = unknown;
export type TupleRecord = Record<TupleKey, TupleValue>;

export type MergeTuples<A extends TupleRecord, B extends TupleRecord> = ClarityTuple<A & B>;

export type PickTuple<T extends TupleRecord, K extends keyof T> = ClarityTuple<Pick<T, K>>;
export type OmitTuple<T extends TupleRecord, K extends keyof T> = ClarityTuple<Omit<T, K>>;

export function makeTuple<T extends TupleRecord>(data: T): ClarityTuple<T> {
  return { type: 'tuple', data: { ...data } };
}

export function makeEmptyTuple(): ClarityTuple<Record<string, never>> {
  return { type: 'tuple', data: {} as Record<string, never> };
}

export function getTupleField<T extends TupleRecord, K extends keyof T>(
  tuple: ClarityTuple<T>,
  key: K
): T[K] {
  return tuple.data[key];
}

export function setTupleField<T extends TupleRecord, K extends string, V>(
  tuple: ClarityTuple<T>,
  key: K,
  value: V
): ClarityTuple<T & Record<K, V>> {
  return makeTuple({ ...tuple.data, [key]: value } as T & Record<K, V>);
}

export function mergeTuples<A extends TupleRecord, B extends TupleRecord>(
  a: ClarityTuple<A>,
  b: ClarityTuple<B>
): MergeTuples<A, B> {
  return makeTuple({ ...a.data, ...b.data }) as MergeTuples<A, B>;
}

export function getTupleKeys<T extends TupleRecord>(tuple: ClarityTuple<T>): (keyof T)[] {
  return Object.keys(tuple.data) as (keyof T)[];
}

export function getTupleValues<T extends TupleRecord>(tuple: ClarityTuple<T>): T[keyof T][] {
  return Object.values(tuple.data) as T[keyof T][];
}

export function tupleHasField<T extends TupleRecord>(tuple: ClarityTuple<T>, key: string): boolean {
  return key in tuple.data;
}

export function tupleToObject<T extends TupleRecord>(tuple: ClarityTuple<T>): T {
  return { ...tuple.data };
}

export function tupleFieldCount<T extends TupleRecord>(tuple: ClarityTuple<T>): number {
  return Object.keys(tuple.data).length;
}

export function areTuplesEqual<T extends TupleRecord>(a: ClarityTuple<T>, b: ClarityTuple<T>): boolean {
  return JSON.stringify(a.data) === JSON.stringify(b.data);
}

export function isClarityTuple(v: unknown): v is ClarityTuple {
  return typeof v === 'object' && v !== null && (v as ClarityTuple).type === 'tuple';
}

export function renameTupleField<T extends TupleRecord>(
  tuple: ClarityTuple<T>,
  oldKey: keyof T,
  newKey: string
): ClarityTuple<Record<string, TupleValue>> {
  const result: Record<string, TupleValue> = { ...tuple.data };
  result[newKey] = result[oldKey as string];
  delete result[oldKey as string];
  return makeTuple(result);
}

export function mapTupleValues<T extends Record<string, unknown>>(
  tuple: ClarityTuple<T>,
  fn: (value: unknown, key: string) => unknown
): ClarityTuple<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(tuple.data)) {
    result[key] = fn(value, key);
  }
  return makeTuple(result);
}

export function filterTupleFields<T extends Record<string, unknown>>(
  tuple: ClarityTuple<T>,
  predicate: (key: string, value: unknown) => boolean
): ClarityTuple<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(tuple.data)) {
    if (predicate(key, value)) result[key] = value;
  }
  return makeTuple(result);
}
