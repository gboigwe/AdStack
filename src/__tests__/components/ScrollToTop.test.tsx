import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScrollToTop } from '@/components/ui/ScrollToTop';

describe('ScrollToTop', () => {
  let scrollToSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset scrollY
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy;
  });

  it('renders a button with aria-label', () => {
    render(<ScrollToTop />);
    expect(screen.getByLabelText('Scroll to top')).toBeDefined();
  });

  it('is hidden initially (scrollY = 0)', () => {
    render(<ScrollToTop />);
    const btn = screen.getByLabelText('Scroll to top');
    expect(btn.getAttribute('aria-hidden')).toBe('true');
    expect(btn.tabIndex).toBe(-1);
  });

  it('becomes visible after scrolling past threshold', () => {
    render(<ScrollToTop />);
    const btn = screen.getByLabelText('Scroll to top');

    // Simulate scroll past 400px threshold
    Object.defineProperty(window, 'scrollY', { value: 500 });
    fireEvent.scroll(window);

    expect(btn.getAttribute('aria-hidden')).toBe('false');
    expect(btn.tabIndex).toBe(0);
  });

  it('hides again when scrolling back above threshold', () => {
    render(<ScrollToTop />);
    const btn = screen.getByLabelText('Scroll to top');

    // Scroll down
    Object.defineProperty(window, 'scrollY', { value: 500 });
    fireEvent.scroll(window);
    expect(btn.getAttribute('aria-hidden')).toBe('false');

    // Scroll back up
    Object.defineProperty(window, 'scrollY', { value: 100 });
    fireEvent.scroll(window);
    expect(btn.getAttribute('aria-hidden')).toBe('true');
  });

  it('calls window.scrollTo with smooth behavior on click', () => {
    render(<ScrollToTop />);

    // Make button visible first
    Object.defineProperty(window, 'scrollY', { value: 600 });
    fireEvent.scroll(window);

    fireEvent.click(screen.getByLabelText('Scroll to top'));
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('has pointer-events-none when hidden', () => {
    render(<ScrollToTop />);
    const btn = screen.getByLabelText('Scroll to top');
    expect(btn.className).toContain('pointer-events-none');
  });

  it('removes pointer-events-none when visible', () => {
    render(<ScrollToTop />);
    const btn = screen.getByLabelText('Scroll to top');

    Object.defineProperty(window, 'scrollY', { value: 500 });
    fireEvent.scroll(window);

    expect(btn.className).not.toContain('pointer-events-none');
  });

  it('cleans up scroll listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ScrollToTop />);
    unmount();

    const scrollCalls = removeSpy.mock.calls.filter(
      ([event]) => event === 'scroll',
    );
    expect(scrollCalls.length).toBeGreaterThan(0);
    removeSpy.mockRestore();
  });
});
