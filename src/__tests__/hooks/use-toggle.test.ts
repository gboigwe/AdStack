import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToggle } from '@/hooks/use-toggle';

describe('useToggle', () => {
  it('defaults to false', () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current[0]).toBe(false);
  });

  it('accepts a custom initial value', () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current[0]).toBe(true);
  });

  it('toggles the value', () => {
    const { result } = renderHook(() => useToggle(false));
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
  });

  it('allows explicit setValue', () => {
    const { result } = renderHook(() => useToggle(false));
    act(() => result.current[2](true));
    expect(result.current[0]).toBe(true);
    act(() => result.current[2](true));
    expect(result.current[0]).toBe(true); // remains true
    act(() => result.current[2](false));
    expect(result.current[0]).toBe(false);
  });

  it('toggle callback has stable identity', () => {
    const { result, rerender } = renderHook(() => useToggle());
    const firstToggle = result.current[1];
    rerender();
    expect(result.current[1]).toBe(firstToggle);
  });
});
