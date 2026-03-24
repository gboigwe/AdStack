import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  SkeletonLines,
  SkeletonStatCard,
  SkeletonCard,
  SkeletonStatGrid,
} from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders with role="status" and aria-label', () => {
    render(<Skeleton />);
    const el = screen.getByRole('status');
    expect(el).toBeDefined();
    expect(el.getAttribute('aria-label')).toBe('Loading');
  });

  it('applies animate-pulse class', () => {
    render(<Skeleton />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('animate-pulse');
  });

  it('merges custom className', () => {
    render(<Skeleton className="h-4 w-32" />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('h-4');
    expect(el.className).toContain('w-32');
  });

  it('applies inline width and height styles', () => {
    render(<Skeleton width="100px" height="20px" />);
    const el = screen.getByRole('status');
    expect(el.style.width).toBe('100px');
    expect(el.style.height).toBe('20px');
  });
});

describe('SkeletonLines', () => {
  it('renders default 3 skeleton lines', () => {
    render(<SkeletonLines />);
    const skeletons = screen.getAllByRole('status');
    expect(skeletons).toHaveLength(3);
  });

  it('renders custom count of lines', () => {
    render(<SkeletonLines count={5} />);
    const skeletons = screen.getAllByRole('status');
    expect(skeletons).toHaveLength(5);
  });

  it('makes last line shorter (w-3/4)', () => {
    render(<SkeletonLines count={3} />);
    const skeletons = screen.getAllByRole('status');
    const lastSkeleton = skeletons[skeletons.length - 1] as HTMLElement;
    expect(lastSkeleton.className).toContain('w-3/4');
  });
});

describe('SkeletonStatCard', () => {
  it('renders multiple skeleton elements for the stat layout', () => {
    render(<SkeletonStatCard />);
    const skeletons = screen.getAllByRole('status');
    // 4 skeletons: label, value, subtitle, icon circle
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });
});

describe('SkeletonCard', () => {
  it('renders heading skeleton plus content lines', () => {
    render(<SkeletonCard lines={3} />);
    const skeletons = screen.getAllByRole('status');
    // 1 heading + 3 content lines = 4
    expect(skeletons).toHaveLength(4);
  });

  it('respects custom line count', () => {
    render(<SkeletonCard lines={5} />);
    const skeletons = screen.getAllByRole('status');
    expect(skeletons).toHaveLength(6); // 1 heading + 5
  });
});

describe('SkeletonStatGrid', () => {
  it('renders default 4 stat card skeletons', () => {
    const { container } = render(<SkeletonStatGrid />);
    const cards = container.querySelectorAll('.bg-white');
    expect(cards).toHaveLength(4);
  });

  it('renders custom count of cards', () => {
    const { container } = render(<SkeletonStatGrid count={2} />);
    const cards = container.querySelectorAll('.bg-white');
    expect(cards).toHaveLength(2);
  });
});
