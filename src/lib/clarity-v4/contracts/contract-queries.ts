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
