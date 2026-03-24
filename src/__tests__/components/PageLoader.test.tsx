import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageLoader, InlineLoader } from '@/components/ui/PageLoader';

describe('PageLoader', () => {
  it('renders with role="status"', () => {
    render(<PageLoader />);
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('shows "Loading..." text', () => {
    render(<PageLoader />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('has a minimum height for full-page display', () => {
    const { container } = render(<PageLoader />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('min-h-[50vh]');
  });

  it('contains an animated spinner', () => {
    const { container } = render(<PageLoader />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
  });
});

describe('InlineLoader', () => {
  it('renders with role="status"', () => {
    render(<InlineLoader />);
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('has screen-reader loading text', () => {
    render(<InlineLoader />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('contains an animated spinner', () => {
    const { container } = render(<InlineLoader />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
  });

  it('merges custom className', () => {
    const { container } = render(<InlineLoader className="mt-4" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('mt-4');
  });
});
