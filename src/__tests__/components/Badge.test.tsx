import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, campaignStatusVariant } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeDefined();
  });

  it('applies default variant styles', () => {
    const { container } = render(<Badge>Default</Badge>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('bg-gray-100');
  });

  it('applies success variant styles', () => {
    const { container } = render(<Badge variant="success">OK</Badge>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('bg-green-100');
  });

  it('applies warning variant styles', () => {
    const { container } = render(<Badge variant="warning">Warn</Badge>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('bg-yellow-100');
  });

  it('applies error variant styles', () => {
    const { container } = render(<Badge variant="error">Err</Badge>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('bg-red-100');
  });

  it('applies info variant styles', () => {
    const { container } = render(<Badge variant="info">Info</Badge>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('bg-blue-100');
  });

  it('applies purple variant styles', () => {
    const { container } = render(<Badge variant="purple">Special</Badge>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('bg-purple-100');
  });

  it('renders as a pill-shaped span', () => {
    const { container } = render(<Badge>Pill</Badge>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('SPAN');
    expect(el.className).toContain('rounded-full');
  });

  it('merges custom className', () => {
    const { container } = render(<Badge className="ml-2">Custom</Badge>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('ml-2');
  });
});

describe('campaignStatusVariant', () => {
  it('maps active to success', () => {
    expect(campaignStatusVariant('active')).toBe('success');
    expect(campaignStatusVariant('Active')).toBe('success');
  });

  it('maps paused to warning', () => {
    expect(campaignStatusVariant('paused')).toBe('warning');
  });

  it('maps completed to info', () => {
    expect(campaignStatusVariant('completed')).toBe('info');
  });

  it('maps cancelled to error', () => {
    expect(campaignStatusVariant('cancelled')).toBe('error');
  });

  it('maps draft and unknown to default', () => {
    expect(campaignStatusVariant('draft')).toBe('default');
    expect(campaignStatusVariant('unknown')).toBe('default');
  });
});
