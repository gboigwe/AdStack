import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/ui';
import { TrendingUp } from 'lucide-react';

describe('StatCard', () => {
  it('renders the label', () => {
    render(<StatCard label="Total Revenue" value="1,234 STX" icon={TrendingUp} />);
    expect(screen.getByText('Total Revenue')).toBeDefined();
  });

  it('renders the value', () => {
    render(<StatCard label="Budget" value="500 STX" icon={TrendingUp} />);
    expect(screen.getByText('500 STX')).toBeDefined();
  });

  it('renders em-dash when value is undefined', () => {
    render(<StatCard label="Revenue" icon={TrendingUp} />);
    expect(screen.getByText('—')).toBeDefined();
  });

  it('renders subtitle when provided', () => {
    render(
      <StatCard
        label="Impressions"
        value="10k"
        icon={TrendingUp}
        subtitle="+5% from last week"
      />,
    );
    expect(screen.getByText('+5% from last week')).toBeDefined();
  });

  it('does not render subtitle when omitted', () => {
    const { container } = render(
      <StatCard label="Count" value="42" icon={TrendingUp} />,
    );
    const subtitleEls = container.querySelectorAll('.text-xs');
    expect(subtitleEls.length).toBe(0);
  });

  it('shows skeleton when isLoading is true', () => {
    render(<StatCard label="Revenue" value="100" icon={TrendingUp} isLoading />);
    expect(screen.queryByText('100')).toBeNull();
    expect(screen.getByRole('status')).toBeDefined(); // Skeleton has role="status"
  });

  it('renders a LucideIcon component', () => {
    const { container } = render(
      <StatCard label="Test" value="1" icon={TrendingUp} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders a ReactNode icon', () => {
    const customIcon = <span data-testid="custom-icon">★</span>;
    render(<StatCard label="Stars" value="5" icon={customIcon} />);
    expect(screen.getByTestId('custom-icon')).toBeDefined();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatCard label="Test" value="1" icon={TrendingUp} className="col-span-2" />,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('col-span-2');
  });
});
