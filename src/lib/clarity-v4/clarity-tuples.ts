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
