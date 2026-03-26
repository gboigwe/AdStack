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

export function mapQueryResult<T, U>(r: QueryResult<T>, fn: (data: T) => U): QueryResult<U> {
  if (r.loading) return loadingQuery<U>();
  if (r.error) return errorQuery<U>(r.error);
  if (r.data === null) return errorQuery<U>('No data');
  return successQuery(fn(r.data));
}

export type PaginatedQuery<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export function makePaginatedQuery<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedQuery<T> {
  return { items, total, page, pageSize, hasMore: page * pageSize < total };
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): PaginatedQuery<T> {
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  return makePaginatedQuery(pageItems, items.length, page, pageSize);
}

export type SortDirection = 'asc' | 'desc';

export function sortItems<T>(
  items: T[],
  key: keyof T,
  direction: SortDirection = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av < bv) return direction === 'asc' ? -1 : 1;
    if (av > bv) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function filterItems<T>(items: T[], predicate: (item: T) => boolean): T[] {
  return items.filter(predicate);
}

export function searchItems<T>(items: T[], searchKey: keyof T, query: string): T[] {
  const q = query.toLowerCase();
  return items.filter(item => String(item[searchKey]).toLowerCase().includes(q));
}
