import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/use-local-storage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('returns the stored value when one exists', () => {
    localStorage.setItem('key', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('key', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('persists a new value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('key')!)).toBe('updated');
  });

  it('supports functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1]((prev) => prev + 10);
    });
    expect(result.current[0]).toBe(11);
    expect(JSON.parse(localStorage.getItem('count')!)).toBe(11);
  });

  it('handles objects', () => {
    const { result } = renderHook(() =>
      useLocalStorage('obj', { name: 'Alice', score: 0 }),
    );

    act(() => {
      result.current[1]({ name: 'Bob', score: 42 });
    });

    expect(result.current[0]).toEqual({ name: 'Bob', score: 42 });
    expect(JSON.parse(localStorage.getItem('obj')!)).toEqual({
      name: 'Bob',
      score: 42,
    });
  });

  it('falls back to initial value when stored JSON is malformed', () => {
    localStorage.setItem('broken', '{invalid json');
    const { result } = renderHook(() => useLocalStorage('broken', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('falls back to initial value when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(() => useLocalStorage('blocked', 'safe'));
    expect(result.current[0]).toBe('safe');
  });

  it('handles localStorage.setItem failure gracefully', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'start'));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });

    // Should not throw — keeps in-memory state
    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
  });

  it('works with arrays', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('list', []));

    act(() => {
      result.current[1]((prev) => [...prev, 'item1']);
    });

    act(() => {
      result.current[1]((prev) => [...prev, 'item2']);
    });

    expect(result.current[0]).toEqual(['item1', 'item2']);
  });

  it('stores boolean values correctly', () => {
    const { result } = renderHook(() =>
      useLocalStorage('toggle', false),
    );

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);
    expect(JSON.parse(localStorage.getItem('toggle')!)).toBe(true);
  });
});
