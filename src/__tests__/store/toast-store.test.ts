import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore } from '@/store/toast-store';

describe('toast-store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.getState().clearToasts();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with an empty toast list', () => {
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it('addToast appends a toast with generated id', () => {
    useToastStore.getState().addToast({ type: 'success', title: 'Saved' });

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].id).toMatch(/^toast-/);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].title).toBe('Saved');
  });

  it('addToast preserves optional message', () => {
    useToastStore.getState().addToast({
      type: 'error',
      title: 'Fail',
      message: 'Something broke',
    });

    expect(useToastStore.getState().toasts[0].message).toBe('Something broke');
  });

  it('removeToast removes a specific toast by id', () => {
    useToastStore.getState().addToast({ type: 'info', title: 'A' });
    useToastStore.getState().addToast({ type: 'info', title: 'B' });

    const [first] = useToastStore.getState().toasts;
    useToastStore.getState().removeToast(first.id);

    const remaining = useToastStore.getState().toasts;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].title).toBe('B');
  });

  it('clearToasts removes all toasts', () => {
    useToastStore.getState().addToast({ type: 'success', title: 'A' });
    useToastStore.getState().addToast({ type: 'error', title: 'B' });
    useToastStore.getState().addToast({ type: 'info', title: 'C' });

    useToastStore.getState().clearToasts();
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it('auto-removes toast after default 5s duration', () => {
    useToastStore.getState().addToast({ type: 'success', title: 'Auto' });
    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(5000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('respects custom duration', () => {
    useToastStore.getState().addToast({
      type: 'info',
      title: 'Custom',
      duration: 2000,
    });

    vi.advanceTimersByTime(1999);
    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('duration of 0 prevents auto-removal', () => {
    useToastStore.getState().addToast({
      type: 'warning',
      title: 'Persistent',
      duration: 0,
    });

    vi.advanceTimersByTime(60000);
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it('generates unique ids for each toast', () => {
    useToastStore.getState().addToast({ type: 'info', title: 'A' });
    useToastStore.getState().addToast({ type: 'info', title: 'B' });

    const ids = useToastStore.getState().toasts.map((t) => t.id);
    expect(ids[0]).not.toBe(ids[1]);
  });
});
