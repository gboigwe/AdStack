import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMounted } from '@/hooks';

describe('useMounted', () => {
  it('returns true after mount', () => {
    const { result } = renderHook(() => useMounted());
    // After renderHook completes, the effect has run
    expect(result.current).toBe(true);
  });

  it('returns a stable boolean', () => {
    const { result, rerender } = renderHook(() => useMounted());
    expect(result.current).toBe(true);

    rerender();
    expect(result.current).toBe(true);
  });
});
