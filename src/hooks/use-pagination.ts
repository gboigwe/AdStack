'use client';

import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
  /** Total number of items */
  totalItems: number;
  /** Items per page (default: 20) */
  pageSize?: number;
  /** Starting page index (default: 0) */
  initialPage?: number;
}

interface UsePaginationReturn {
  /** Current page index (0-based) */
  page: number;
  /** Number of pages */
  totalPages: number;
  /** Items per page */
  pageSize: number;
  /** Offset for API calls: page * pageSize */
  offset: number;
  /** True when on the first page */
  isFirstPage: boolean;
  /** True when on the last page */
  isLastPage: boolean;
  /** Navigate to a specific page */
  goToPage: (page: number) => void;
  /** Go to the next page (clamped) */
  nextPage: () => void;
  /** Go to the previous page (clamped) */
  prevPage: () => void;
  /** Go to first page */
  firstPage: () => void;
  /** Go to last page */
  lastPage: () => void;
  /** Reset to initial page */
  reset: () => void;
}

/**
 * Manages pagination state for lists and tables.
 *
 * Computes totalPages, offset, and boundary flags from totalItems
 * and pageSize so pages don't have to track this themselves.
 *
 * @example
 * const { page, offset, totalPages, nextPage, prevPage } = usePagination({
 *   totalItems: data.total,
 *   pageSize: 20,
 * });
 * const { data } = useTransactions(address, pageSize, offset);
 */
export function usePagination({
  totalItems,
  pageSize = 20,
  initialPage = 0,
}: UsePaginationOptions): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize],
  );

  const offset = page * pageSize;
  const isFirstPage = page === 0;
  const isLastPage = page >= totalPages - 1;

  const goToPage = useCallback(
    (p: number) => setPage(Math.max(0, Math.min(p, totalPages - 1))),
    [totalPages],
  );

  const nextPage = useCallback(
    () => setPage((p) => Math.min(p + 1, totalPages - 1)),
    [totalPages],
  );

  const prevPage = useCallback(
    () => setPage((p) => Math.max(p - 1, 0)),
    [],
  );

  const firstPage = useCallback(() => setPage(0), []);

  const lastPage = useCallback(
    () => setPage(totalPages - 1),
    [totalPages],
  );

  const reset = useCallback(() => setPage(initialPage), [initialPage]);

  return {
    page,
    totalPages,
    pageSize,
    offset,
    isFirstPage,
    isLastPage,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    reset,
  };
}
