import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeDefined();
  });

  it('includes default padding', () => {
    const { container } = render(<Card>Content</Card>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('p-6');
  });

  it('removes padding when noPadding=true', () => {
    const { container } = render(<Card noPadding>Content</Card>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).not.toContain('p-6');
  });

  it('adds hover styles when hoverable=true', () => {
    const { container } = render(<Card hoverable>Content</Card>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('hover:border-blue-200');
  });

  it('does not add hover styles by default', () => {
    const { container } = render(<Card>Content</Card>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).not.toContain('hover:border-blue-200');
  });

  it('has dark mode background and border', () => {
    const { container } = render(<Card>Content</Card>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('dark:bg-gray-900');
    expect(el.className).toContain('dark:border-gray-700');
  });

  it('merges custom className', () => {
    const { container } = render(<Card className="col-span-2">Content</Card>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('col-span-2');
  });
});

describe('CardHeader', () => {
  it('renders children as heading', () => {
    render(<CardHeader>Dashboard</CardHeader>);
    expect(screen.getByText('Dashboard')).toBeDefined();
  });

  it('renders action slot', () => {
    render(
      <CardHeader action={<button>Export</button>}>Title</CardHeader>,
    );
    expect(screen.getByText('Export')).toBeDefined();
  });

  it('has a bottom border', () => {
    const { container } = render(<CardHeader>Title</CardHeader>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('border-b');
  });
});

describe('CardBody', () => {
  it('renders children with padding', () => {
    render(<CardBody>Body content</CardBody>);
    expect(screen.getByText('Body content')).toBeDefined();
  });

  it('has p-6 padding', () => {
    const { container } = render(<CardBody>Content</CardBody>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('p-6');
  });
});
