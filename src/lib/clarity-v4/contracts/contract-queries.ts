// Clarity v4 Contract Read-Only Query Helpers

export type QueryOptions = {
  network: 'mainnet' | 'testnet';
  contractId: string;
  functionName: string;
  args: unknown[];
};

export type QueryResult<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

export function loadingQuery<T>(): QueryResult<T> {
  return { data: null, error: null, loading: true };
}

export function successQuery<T>(data: T): QueryResult<T> {
  return { data, error: null, loading: false };
}

export function errorQuery<T>(error: string): QueryResult<T> {
  return { data: null, error, loading: false };
}

export function isQueryLoading<T>(r: QueryResult<T>): boolean {
  return r.loading;
}

export function isQuerySuccess<T>(r: QueryResult<T>): boolean {
  return !r.loading && r.error === null && r.data !== null;
}

export function isQueryError<T>(r: QueryResult<T>): boolean {
  return !r.loading && r.error !== null;
}
