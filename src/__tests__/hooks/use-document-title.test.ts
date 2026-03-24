import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from '@/hooks';

describe('useDocumentTitle', () => {
  const ORIGINAL_TITLE = 'AdStack';

  beforeEach(() => {
    document.title = ORIGINAL_TITLE;
  });

  it('sets the document title', () => {
    renderHook(() => useDocumentTitle('Campaign #42'));
    expect(document.title).toBe('Campaign #42');
  });

  it('updates when title changes', () => {
    const { rerender } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: 'Page A' } },
    );

    expect(document.title).toBe('Page A');

    rerender({ title: 'Page B' });
    expect(document.title).toBe('Page B');
  });

  it('restores previous title on unmount by default', () => {
    const { unmount } = renderHook(() => useDocumentTitle('Temporary Title'));
    expect(document.title).toBe('Temporary Title');

    unmount();
    expect(document.title).toBe(ORIGINAL_TITLE);
  });

  it('does not restore title when restoreOnUnmount is false', () => {
    const { unmount } = renderHook(() =>
      useDocumentTitle('Persistent Title', { restoreOnUnmount: false }),
    );
    expect(document.title).toBe('Persistent Title');

    unmount();
    expect(document.title).toBe('Persistent Title');
  });

  it('skips update for undefined title', () => {
    renderHook(() => useDocumentTitle(undefined));
    expect(document.title).toBe(ORIGINAL_TITLE);
  });

  it('skips update for empty string title', () => {
    renderHook(() => useDocumentTitle(''));
    expect(document.title).toBe(ORIGINAL_TITLE);
  });
});
