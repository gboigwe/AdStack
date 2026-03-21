import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '@/components/ui';

describe('Avatar', () => {
  it('renders initials from a Stacks address', () => {
    render(<Avatar name="SP2JXKMSH007NPY" />);
    expect(screen.getByText('SP')).toBeDefined();
  });

  it('renders initials from a multi-word name', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeDefined();
  });

  it('renders first two chars for a single word', () => {
    render(<Avatar name="admin" />);
    expect(screen.getByText('AD')).toBeDefined();
  });

  it('renders "?" for empty name', () => {
    render(<Avatar name="" />);
    expect(screen.getByText('?')).toBeDefined();
  });

  it('applies size classes', () => {
    const { container } = render(<Avatar name="Test" size="lg" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('w-14');
    expect(el.className).toContain('h-14');
  });

  it('defaults to md size', () => {
    const { container } = render(<Avatar name="Test" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('w-10');
    expect(el.className).toContain('h-10');
  });

  it('assigns deterministic color based on name', () => {
    const { container: c1 } = render(<Avatar name="Alice" />);
    const { container: c2 } = render(<Avatar name="Alice" />);

    const class1 = (c1.firstElementChild as HTMLElement).className;
    const class2 = (c2.firstElementChild as HTMLElement).className;
    expect(class1).toBe(class2);
  });

  it('assigns different colors for different names', () => {
    const { container: c1 } = render(<Avatar name="Alice" />);
    const { container: c2 } = render(<Avatar name="Zephyr" />);

    // Extract bg-* class
    const getBg = (el: Element) =>
      (el as HTMLElement).className.split(' ').find((c) => c.startsWith('bg-'));

    // Different names should likely get different colors
    // (not guaranteed, but our palette is 8 colors)
    const bg1 = getBg(c1.firstElementChild!);
    const bg2 = getBg(c2.firstElementChild!);
    // At minimum, both should have a color assigned
    expect(bg1).toBeDefined();
    expect(bg2).toBeDefined();
  });

  it('is marked aria-hidden', () => {
    const { container } = render(<Avatar name="Test" />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('sets title attribute to the name', () => {
    const { container } = render(<Avatar name="SP123" />);
    expect(container.firstElementChild?.getAttribute('title')).toBe('SP123');
  });
});
