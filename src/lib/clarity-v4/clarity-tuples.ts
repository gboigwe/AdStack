// Clarity v4 Tuple Builders and Merge Utilities

export type ClarityTuple<T extends Record<string, unknown> = Record<string, unknown>> = {
  type: 'tuple';
  data: T;
};

export type TupleKey = string;
export type TupleValue = unknown;
export type TupleRecord = Record<TupleKey, TupleValue>;
