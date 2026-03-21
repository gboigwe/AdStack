import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingButton } from '@/components/ui';

describe('LoadingButton', () => {
  it('renders children text', () => {
    render(<LoadingButton>Submit</LoadingButton>);
    expect(screen.getByText('Submit')).toBeDefined();
  });

  it('fires onClick when clicked', () => {
    const onClick = vi.fn();
    render(<LoadingButton onClick={onClick}>Click</LoadingButton>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading=true', () => {
    render(<LoadingButton loading>Submit</LoadingButton>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveProperty('disabled', true);
  });

  it('is disabled when disabled=true', () => {
    render(<LoadingButton disabled>Submit</LoadingButton>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveProperty('disabled', true);
  });

  it('shows spinner SVG when loading', () => {
    const { container } = render(<LoadingButton loading>Submit</LoadingButton>);
    const svg = container.querySelector('svg.animate-spin');
    expect(svg).not.toBeNull();
  });

  it('does not show spinner when not loading', () => {
    const { container } = render(<LoadingButton>Submit</LoadingButton>);
    const svg = container.querySelector('svg.animate-spin');
    expect(svg).toBeNull();
  });

  it('shows loadingText when loading', () => {
    render(
      <LoadingButton loading loadingText="Submitting...">
        Submit
      </LoadingButton>,
    );
    expect(screen.getByText('Submitting...')).toBeDefined();
    expect(screen.queryByText('Submit')).toBeNull();
  });

  it('applies primary variant styles by default', () => {
    const { container } = render(<LoadingButton>Primary</LoadingButton>);
    const btn = container.firstElementChild as HTMLElement;
    expect(btn.className).toContain('bg-blue-600');
  });

  it('applies secondary variant styles', () => {
    const { container } = render(
      <LoadingButton variant="secondary">Secondary</LoadingButton>,
    );
    const btn = container.firstElementChild as HTMLElement;
    expect(btn.className).toContain('bg-gray-100');
  });

  it('applies danger variant styles', () => {
    const { container } = render(
      <LoadingButton variant="danger">Delete</LoadingButton>,
    );
    const btn = container.firstElementChild as HTMLElement;
    expect(btn.className).toContain('bg-red-600');
  });

  it('merges custom className', () => {
    const { container } = render(
      <LoadingButton className="w-full">Full Width</LoadingButton>,
    );
    const btn = container.firstElementChild as HTMLElement;
    expect(btn.className).toContain('w-full');
  });
});
