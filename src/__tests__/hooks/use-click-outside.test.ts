import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClickOutside } from '@/hooks';

describe('useClickOutside', () => {
  it('returns a ref object', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(handler));
    expect(result.current).toHaveProperty('current');
  });

  it('calls handler when clicking outside the ref element', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(handler));

    // Create and attach a target element
    const div = document.createElement('div');
    document.body.appendChild(div);
    (result.current as { current: HTMLDivElement | null }).current = div;

    // Simulate clicking outside
    const outsideEvent = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(outsideEvent);

    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(div);
  });

  it('does not call handler when clicking inside the ref element', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(handler));

    const div = document.createElement('div');
    const child = document.createElement('span');
    div.appendChild(child);
    document.body.appendChild(div);
    (result.current as { current: HTMLDivElement | null }).current = div;

    // Simulate clicking on the child inside the ref
    const insideEvent = new MouseEvent('mousedown', { bubbles: true });
    child.dispatchEvent(insideEvent);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(div);
  });

  it('does not call handler when clicking the ref element itself', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(handler));

    const div = document.createElement('div');
    document.body.appendChild(div);
    (result.current as { current: HTMLDivElement | null }).current = div;

    const selfEvent = new MouseEvent('mousedown', { bubbles: true });
    div.dispatchEvent(selfEvent);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(div);
  });

  it('responds to touchstart events', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useClickOutside<HTMLDivElement>(handler));

    const div = document.createElement('div');
    document.body.appendChild(div);
    (result.current as { current: HTMLDivElement | null }).current = div;

    const touchEvent = new Event('touchstart', { bubbles: true });
    document.body.dispatchEvent(touchEvent);

    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(div);
  });

  it('cleans up listeners on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useClickOutside<HTMLDivElement>(handler));

    unmount();

    const event = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('uses latest handler without re-registering listeners', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ handler }) => useClickOutside<HTMLDivElement>(handler),
      { initialProps: { handler: handler1 } },
    );

    const div = document.createElement('div');
    document.body.appendChild(div);
    (result.current as { current: HTMLDivElement | null }).current = div;

    // Update handler
    rerender({ handler: handler2 });

    // Click outside
    const event = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(event);

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledTimes(1);

    document.body.removeChild(div);
  });
});
