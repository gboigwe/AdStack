// Generic Hiro API response wrapper types

export interface PaginatedResponse<T> {
  limit: number;
  offset: number;
  total: number;
  results: T[];
}

export interface ApiError {
  error: string;
  message: string;
  code?: number;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };
