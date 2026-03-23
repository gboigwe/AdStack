import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/use-pagination';

describe('usePagination', () => {
  it('computes totalPages from totalItems and pageSize', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, pageSize: 20 }),
    );
    expect(result.current.totalPages).toBe(5);
    expect(result.current.pageSize).toBe(20);
  });

  it('rounds up partial pages', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 21, pageSize: 20 }),
    );
    expect(result.current.totalPages).toBe(2);
  });

  it('starts on page 0 by default', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 50, pageSize: 10 }),
    );
    expect(result.current.page).toBe(0);
    expect(result.current.offset).toBe(0);
    expect(result.current.isFirstPage).toBe(true);
    expect(result.current.isLastPage).toBe(false);
  });

  it('uses initialPage when provided', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, pageSize: 10, initialPage: 3 }),
    );
    expect(result.current.page).toBe(3);
    expect(result.current.offset).toBe(30);
  });

  it('navigates with nextPage and prevPage', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 60, pageSize: 20 }),
    );
    act(() => result.current.nextPage());
    expect(result.current.page).toBe(1);
    expect(result.current.offset).toBe(20);

    act(() => result.current.nextPage());
    expect(result.current.page).toBe(2);
    expect(result.current.isLastPage).toBe(true);

    // Should clamp at last page
    act(() => result.current.nextPage());
    expect(result.current.page).toBe(2);

    act(() => result.current.prevPage());
    expect(result.current.page).toBe(1);
  });

  it('clamps prevPage at 0', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 50, pageSize: 10 }),
    );
    act(() => result.current.prevPage());
    expect(result.current.page).toBe(0);
  });

  it('goToPage clamps within bounds', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 50, pageSize: 10 }),
    );
    act(() => result.current.goToPage(99));
    expect(result.current.page).toBe(4); // last page

    act(() => result.current.goToPage(-5));
    expect(result.current.page).toBe(0);
  });

  it('firstPage and lastPage navigate to boundaries', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 50, pageSize: 10 }),
    );
    act(() => result.current.lastPage());
    expect(result.current.page).toBe(4);
    expect(result.current.isLastPage).toBe(true);

    act(() => result.current.firstPage());
    expect(result.current.page).toBe(0);
    expect(result.current.isFirstPage).toBe(true);
  });

  it('reset returns to initialPage', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, pageSize: 10, initialPage: 2 }),
    );
    act(() => result.current.goToPage(8));
    expect(result.current.page).toBe(8);

    act(() => result.current.reset());
    expect(result.current.page).toBe(2);
  });

  it('handles 0 totalItems gracefully', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 0, pageSize: 10 }),
    );
    expect(result.current.totalPages).toBe(1);
    expect(result.current.isFirstPage).toBe(true);
    expect(result.current.isLastPage).toBe(true);
  });
});
