import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from '@/hooks';

/**
 * Helper: build a container with focusable children and attach it to the DOM.
 */
function createContainer() {
  const container = document.createElement('div');
  const btn1 = document.createElement('button');
  btn1.textContent = 'First';
  const btn2 = document.createElement('button');
  btn2.textContent = 'Second';
  const btn3 = document.createElement('button');
  btn3.textContent = 'Third';

  container.append(btn1, btn2, btn3);
  document.body.appendChild(container);

  return { container, btn1, btn2, btn3 };
}

function fireTab(shift = false) {
  document.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: shift,
      bubbles: true,
      cancelable: true,
    }),
  );
}

describe('useFocusTrap', () => {
  it('returns a ref', () => {
    const { result } = renderHook(() => useFocusTrap(false));
    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull();
  });

  it('focuses the first focusable element when activated', () => {
    const { container, btn1 } = createContainer();
    const focusSpy = vi.spyOn(btn1, 'focus');

    const { result } = renderHook(
      ({ active }) => useFocusTrap(active),
      { initialProps: { active: false } },
    );

    // Attach the container to the ref
    (result.current as React.MutableRefObject<HTMLElement | null>).current = container;

    // Re-render with active=true to trigger the effect
    const { rerender } = renderHook(
      ({ active }) => {
        const ref = useFocusTrap(active);
        (ref as React.MutableRefObject<HTMLElement | null>).current = container;
        return ref;
      },
      { initialProps: { active: true } },
    );

    expect(focusSpy).toHaveBeenCalled();

    // Clean up
    document.body.removeChild(container);
    rerender({ active: false });
  });

  it('does nothing when active is false', () => {
    const { container, btn1 } = createContainer();
    const focusSpy = vi.spyOn(btn1, 'focus');

    renderHook(() => {
      const ref = useFocusTrap(false);
      (ref as React.MutableRefObject<HTMLElement | null>).current = container;
      return ref;
    });

    expect(focusSpy).not.toHaveBeenCalled();
    document.body.removeChild(container);
  });

  it('wraps Tab from last element to first', () => {
    const { container, btn1, btn3 } = createContainer();

    renderHook(() => {
      const ref = useFocusTrap(true);
      (ref as React.MutableRefObject<HTMLElement | null>).current = container;
      return ref;
    });

    // Simulate focus on last button
    btn3.focus();
    const focusSpy = vi.spyOn(btn1, 'focus');

    fireTab(false);
    expect(focusSpy).toHaveBeenCalled();

    document.body.removeChild(container);
  });

  it('wraps Shift+Tab from first element to last', () => {
    const { container, btn1, btn3 } = createContainer();

    renderHook(() => {
      const ref = useFocusTrap(true);
      (ref as React.MutableRefObject<HTMLElement | null>).current = container;
      return ref;
    });

    // Simulate focus on first button
    btn1.focus();
    const focusSpy = vi.spyOn(btn3, 'focus');

    fireTab(true);
    expect(focusSpy).toHaveBeenCalled();

    document.body.removeChild(container);
  });

  it('removes keydown listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { container } = createContainer();

    const { unmount } = renderHook(() => {
      const ref = useFocusTrap(true);
      (ref as React.MutableRefObject<HTMLElement | null>).current = container;
      return ref;
    });

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    removeSpy.mockRestore();
    document.body.removeChild(container);
  });
});
