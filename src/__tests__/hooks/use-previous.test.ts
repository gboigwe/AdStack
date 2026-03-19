import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrevious } from '@/hooks';

describe('usePrevious', () => {
  it('returns undefined on the first render', () => {
    const { result } = renderHook(() => usePrevious(1));
    expect(result.current).toBeUndefined();
  });

  it('returns the previous value after a re-render', () => {
    const { result, rerender } = renderHook(({ val }) => usePrevious(val), {
      initialProps: { val: 'first' },
    });

    expect(result.current).toBeUndefined();

    rerender({ val: 'second' });
    expect(result.current).toBe('first');

    rerender({ val: 'third' });
    expect(result.current).toBe('second');
  });

  it('tracks numeric values', () => {
    const { result, rerender } = renderHook(({ val }) => usePrevious(val), {
      initialProps: { val: 0 },
    });

    rerender({ val: 10 });
    expect(result.current).toBe(0);

    rerender({ val: 42 });
    expect(result.current).toBe(10);
  });

  it('handles null and undefined transitions', () => {
    const { result, rerender } = renderHook(
      ({ val }) => usePrevious(val),
      { initialProps: { val: null as string | null } },
    );

    expect(result.current).toBeUndefined();

    rerender({ val: 'hello' });
    expect(result.current).toBeNull();

    rerender({ val: null });
    expect(result.current).toBe('hello');
  });

  it('returns same value when re-rendered with identical value', () => {
    const { result, rerender } = renderHook(({ val }) => usePrevious(val), {
      initialProps: { val: 'same' },
    });

    rerender({ val: 'same' });
    expect(result.current).toBe('same');
  });
});
