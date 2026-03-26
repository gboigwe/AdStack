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

export function apiOk<T>(data: T): ApiResult<T> { return { ok: true, data }; }
export function apiErr(error: ApiError): ApiResult<never> { return { ok: false, error }; }

export async function wrapFetch<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'unknown', message: res.statusText }));
      return apiErr(err as ApiError);
    }
    const data = await res.json() as T;
    return apiOk(data);
  } catch (e) {
    return apiErr({ error: 'network_error', message: String(e) });
  }
}
