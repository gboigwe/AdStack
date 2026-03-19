import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery, BREAKPOINTS } from '@/hooks/use-media-query';

/* ------------------------------------------------------------------ */
/*  Mock matchMedia                                                   */
/* ------------------------------------------------------------------ */

type ChangeHandler = (e: { matches: boolean }) => void;

let listeners: Map<string, ChangeHandler[]>;
let matchState: Map<string, boolean>;

function createMockMql(query: string) {
  return {
    matches: matchState.get(query) ?? false,
    addEventListener: (_: string, handler: ChangeHandler) => {
      const list = listeners.get(query) ?? [];
      list.push(handler);
      listeners.set(query, list);
    },
    removeEventListener: (_: string, handler: ChangeHandler) => {
      const list = listeners.get(query) ?? [];
      listeners.set(
        query,
        list.filter((h) => h !== handler),
      );
    },
  };
}

function setMatch(query: string, matches: boolean) {
  matchState.set(query, matches);
  const list = listeners.get(query) ?? [];
  list.forEach((handler) => handler({ matches }));
}

beforeEach(() => {
  listeners = new Map();
  matchState = new Map();
  vi.stubGlobal('matchMedia', vi.fn((q: string) => createMockMql(q)));
});

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('useMediaQuery', () => {
  it('returns false by default when media does not match', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('returns true when the media query matches', () => {
    matchState.set('(min-width: 768px)', true);
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('updates when the media match state changes', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(result.current).toBe(false);

    act(() => {
      setMatch('(min-width: 1024px)', true);
    });
    expect(result.current).toBe(true);

    act(() => {
      setMatch('(min-width: 1024px)', false);
    });
    expect(result.current).toBe(false);
  });

  it('removes listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 640px)'));

    expect(listeners.get('(min-width: 640px)')?.length).toBe(1);

    unmount();
    expect(listeners.get('(min-width: 640px)')?.length).toBe(0);
  });

  it('re-registers when query string changes', () => {
    const { rerender } = renderHook(
      ({ q }) => useMediaQuery(q),
      { initialProps: { q: '(min-width: 640px)' } },
    );

    expect(listeners.get('(min-width: 640px)')?.length).toBe(1);

    rerender({ q: '(min-width: 1280px)' });

    // Old listener removed, new one attached
    expect(listeners.get('(min-width: 640px)')?.length).toBe(0);
    expect(listeners.get('(min-width: 1280px)')?.length).toBe(1);
  });
});

describe('BREAKPOINTS', () => {
  it('exports Tailwind-matching breakpoint queries', () => {
    expect(BREAKPOINTS.sm).toBe('(min-width: 640px)');
    expect(BREAKPOINTS.md).toBe('(min-width: 768px)');
    expect(BREAKPOINTS.lg).toBe('(min-width: 1024px)');
    expect(BREAKPOINTS.xl).toBe('(min-width: 1280px)');
  });
});
