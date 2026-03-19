import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIntersectionObserver } from '@/hooks';

/* ------------------------------------------------------------------ */
/*  Mock IntersectionObserver                                         */
/* ------------------------------------------------------------------ */

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let ioCallback: IOCallback;
let ioOptions: IntersectionObserverInit | undefined;
const observeMock = vi.fn();
const disconnectMock = vi.fn();

beforeEach(() => {
  observeMock.mockClear();
  disconnectMock.mockClear();

  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn((callback: IOCallback, options?: IntersectionObserverInit) => {
      ioCallback = callback;
      ioOptions = options;
      return { observe: observeMock, disconnect: disconnectMock };
    }),
  );
});

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('useIntersectionObserver', () => {
  it('returns a ref and isIntersecting=false by default', () => {
    const { result } = renderHook(() => useIntersectionObserver());
    expect(result.current.ref).toBeDefined();
    expect(result.current.isIntersecting).toBe(false);
  });

  it('observes the referenced element', () => {
    const div = document.createElement('div');

    const { result } = renderHook(() => useIntersectionObserver());

    // Simulate attaching ref to a DOM node
    (result.current.ref as React.MutableRefObject<HTMLElement | null>).current = div;

    // Re-render to trigger effect with mounted ref
    const { unmount } = renderHook(() => useIntersectionObserver());

    // The observer was created
    expect(IntersectionObserver).toHaveBeenCalled();
    unmount();
  });

  it('sets isIntersecting=true when entry reports intersection', () => {
    const div = document.createElement('div');

    const { result } = renderHook(() => {
      const hook = useIntersectionObserver();
      // Attach ref immediately
      (hook.ref as React.MutableRefObject<HTMLElement | null>).current = div;
      return hook;
    });

    // Simulate the observer firing with an intersecting entry
    ioCallback([{ isIntersecting: true }]);

    expect(result.current.isIntersecting).toBe(true);
  });

  it('sets isIntersecting=false when element leaves viewport', () => {
    const div = document.createElement('div');

    const { result } = renderHook(() => {
      const hook = useIntersectionObserver();
      (hook.ref as React.MutableRefObject<HTMLElement | null>).current = div;
      return hook;
    });

    ioCallback([{ isIntersecting: true }]);
    expect(result.current.isIntersecting).toBe(true);

    ioCallback([{ isIntersecting: false }]);
    expect(result.current.isIntersecting).toBe(false);
  });

  it('passes rootMargin and threshold to the observer', () => {
    const div = document.createElement('div');

    renderHook(() => {
      const hook = useIntersectionObserver({
        rootMargin: '50px',
        threshold: 0.5,
      });
      (hook.ref as React.MutableRefObject<HTMLElement | null>).current = div;
      return hook;
    });

    expect(ioOptions?.rootMargin).toBe('50px');
    expect(ioOptions?.threshold).toBe(0.5);
  });

  it('disconnects observer on unmount', () => {
    const div = document.createElement('div');

    const { unmount } = renderHook(() => {
      const hook = useIntersectionObserver();
      (hook.ref as React.MutableRefObject<HTMLElement | null>).current = div;
      return hook;
    });

    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });

  it('disconnects after first intersection when triggerOnce=true', () => {
    const div = document.createElement('div');

    renderHook(() => {
      const hook = useIntersectionObserver({ triggerOnce: true });
      (hook.ref as React.MutableRefObject<HTMLElement | null>).current = div;
      return hook;
    });

    ioCallback([{ isIntersecting: true }]);
    expect(disconnectMock).toHaveBeenCalled();
  });

  it('does NOT disconnect on intersection when triggerOnce=false', () => {
    const div = document.createElement('div');

    renderHook(() => {
      const hook = useIntersectionObserver({ triggerOnce: false });
      (hook.ref as React.MutableRefObject<HTMLElement | null>).current = div;
      return hook;
    });

    disconnectMock.mockClear(); // clear the initial call
    ioCallback([{ isIntersecting: true }]);
    expect(disconnectMock).not.toHaveBeenCalled();
  });
});
