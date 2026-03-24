import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEventListener } from '@/hooks';

describe('useEventListener', () => {
  it('attaches a listener to window by default', () => {
    const handler = vi.fn();
    renderHook(() => useEventListener('click', handler));

    window.dispatchEvent(new MouseEvent('click'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('removes listener on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useEventListener('click', handler));

    unmount();
    window.dispatchEvent(new MouseEvent('click'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('attaches listener to a custom element', () => {
    const handler = vi.fn();
    const div = document.createElement('div');
    document.body.appendChild(div);

    renderHook(() => useEventListener('click', handler, div));

    div.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);

    // Window click should NOT fire the handler
    handler.mockClear();
    window.dispatchEvent(new MouseEvent('click'));
    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(div);
  });

  it('always calls the latest handler without re-registering', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { rerender } = renderHook(
      ({ cb }) => useEventListener('resize', cb),
      { initialProps: { cb: handler1 } },
    );

    rerender({ cb: handler2 });
    window.dispatchEvent(new Event('resize'));

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('listens to keydown events', () => {
    const handler = vi.fn();
    renderHook(() => useEventListener('keydown', handler));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].key).toBe('Escape');
  });

  it('handles null element gracefully', () => {
    const handler = vi.fn();
    // Should not throw
    renderHook(() => useEventListener('click', handler, null));

    window.dispatchEvent(new MouseEvent('click'));
    // Handler should not fire because explicit null was passed
    expect(handler).not.toHaveBeenCalled();
  });

  it('re-registers when event name changes', () => {
    const handler = vi.fn();

    const { rerender } = renderHook(
      ({ event }: { event: keyof WindowEventMap }) =>
        useEventListener(event, handler),
      { initialProps: { event: 'click' as keyof WindowEventMap } },
    );

    window.dispatchEvent(new MouseEvent('click'));
    expect(handler).toHaveBeenCalledTimes(1);

    handler.mockClear();
    rerender({ event: 'focus' as keyof WindowEventMap });

    // Old event should no longer fire
    window.dispatchEvent(new MouseEvent('click'));
    expect(handler).not.toHaveBeenCalled();

    // New event should fire
    window.dispatchEvent(new Event('focus'));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
