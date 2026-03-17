import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcut } from '@/hooks';

function fireKey(
  key: string,
  options: Partial<KeyboardEventInit> = {},
  target: EventTarget = document,
) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  target.dispatchEvent(event);
  return event;
}

describe('useKeyboardShortcut', () => {
  it('fires handler on matching key press', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'Escape' }, handler));

    fireKey('Escape');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not fire handler on non-matching key', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'k' }, handler));

    fireKey('j');
    expect(handler).not.toHaveBeenCalled();
  });

  it('matches key case-insensitively', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'K' }, handler));

    fireKey('k');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('requires ctrlKey when specified', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'k', ctrlKey: true }, handler));

    // Without ctrl — should not fire
    fireKey('k');
    expect(handler).not.toHaveBeenCalled();

    // With ctrl — should fire
    fireKey('k', { ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('accepts metaKey as alternative to ctrlKey', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'k', ctrlKey: true }, handler));

    fireKey('k', { metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('requires shiftKey when specified', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'n', shiftKey: true }, handler));

    fireKey('n');
    expect(handler).not.toHaveBeenCalled();

    fireKey('n', { shiftKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores events from input elements by default', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'k' }, handler));

    const input = document.createElement('input');
    document.body.appendChild(input);
    fireKey('k', {}, input);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('ignores events from textarea elements', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: 'k' }, handler));

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    fireKey('k', {}, textarea);

    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it('fires from inputs when ignoreInputs is false', () => {
    const handler = vi.fn();
    renderHook(() =>
      useKeyboardShortcut({ key: 'Escape', ignoreInputs: false }, handler),
    );

    const input = document.createElement('input');
    document.body.appendChild(input);
    fireKey('Escape', {}, input);

    expect(handler).toHaveBeenCalledTimes(1);
    document.body.removeChild(input);
  });

  it('cleans up listener on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() =>
      useKeyboardShortcut({ key: 'k' }, handler),
    );

    unmount();
    fireKey('k');
    expect(handler).not.toHaveBeenCalled();
  });

  it('prevents default on matched shortcut', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcut({ key: '/' }, handler));

    const event = fireKey('/');
    expect(event.defaultPrevented).toBe(true);
  });
});
