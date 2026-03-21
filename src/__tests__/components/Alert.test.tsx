import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert } from '@/components/ui';

describe('Alert', () => {
  it('renders children content', () => {
    render(<Alert>Something happened</Alert>);
    expect(screen.getByText('Something happened')).toBeDefined();
  });

  it('renders with role="alert"', () => {
    render(<Alert>Content</Alert>);
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('renders a title when provided', () => {
    render(<Alert title="Error">Details here</Alert>);
    expect(screen.getByText('Error')).toBeDefined();
  });

  it('applies info variant styles by default', () => {
    const { container } = render(<Alert>Info alert</Alert>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('bg-blue-50');
  });

  it('applies error variant styles', () => {
    const { container } = render(<Alert variant="error">Error</Alert>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('bg-red-50');
  });

  it('applies success variant styles', () => {
    const { container } = render(<Alert variant="success">OK</Alert>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('bg-green-50');
  });

  it('applies warning variant styles', () => {
    const { container } = render(<Alert variant="warning">Warn</Alert>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('bg-yellow-50');
  });

  it('shows dismiss button when onDismiss is provided', () => {
    const onDismiss = vi.fn();
    render(<Alert onDismiss={onDismiss}>Dismissible</Alert>);

    const dismissBtn = screen.getByLabelText('Dismiss alert');
    expect(dismissBtn).toBeDefined();

    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not show dismiss button without onDismiss', () => {
    render(<Alert>Non-dismissible</Alert>);
    expect(screen.queryByLabelText('Dismiss alert')).toBeNull();
  });

  it('merges custom className', () => {
    const { container } = render(<Alert className="mt-4">Custom</Alert>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('mt-4');
  });
});
