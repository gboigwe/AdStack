import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '@/hooks';
import { useToastStore } from '@/store/toast-store';

describe('useToast', () => {
  beforeEach(() => {
    // Clear all toasts between tests
    useToastStore.getState().clearToasts();
  });

  it('returns success, error, info, and warning methods', () => {
    const { result } = renderHook(() => useToast());
    expect(typeof result.current.success).toBe('function');
    expect(typeof result.current.error).toBe('function');
    expect(typeof result.current.info).toBe('function');
    expect(typeof result.current.warning).toBe('function');
  });

  it('success() adds a success toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success('Saved!');
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].title).toBe('Saved!');
  });

  it('error() adds an error toast with message', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.error('Failed', 'Check your connection');
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].title).toBe('Failed');
    expect(toasts[0].message).toBe('Check your connection');
  });

  it('info() adds an info toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.info('Note');
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('info');
    expect(toasts[0].title).toBe('Note');
    expect(toasts[0].message).toBeUndefined();
  });

  it('warning() adds a warning toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.warning('Heads up', 'Low balance');
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe('warning');
    expect(toasts[0].title).toBe('Heads up');
    expect(toasts[0].message).toBe('Low balance');
  });

  it('multiple calls add multiple toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success('One');
      result.current.error('Two');
      result.current.info('Three');
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(3);
    expect(toasts.map((t) => t.type)).toEqual(['success', 'error', 'info']);
  });
});
