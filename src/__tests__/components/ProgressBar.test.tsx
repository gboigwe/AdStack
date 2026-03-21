import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '@/components/ui';

describe('ProgressBar', () => {
  it('renders with role="progressbar"', () => {
    render(<ProgressBar value={0.5} />);
    expect(screen.getByRole('progressbar')).toBeDefined();
  });

  it('sets aria-valuenow to percentage', () => {
    render(<ProgressBar value={0.75} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('75');
  });

  it('clamps value between 0 and 1', () => {
    const { rerender } = render(<ProgressBar value={1.5} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');

    rerender(<ProgressBar value={-0.5} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });

  it('shows label text', () => {
    render(<ProgressBar value={0.5} label="Budget Used" />);
    expect(screen.getByText('Budget Used')).toBeDefined();
  });

  it('shows percentage when showPercentage is true', () => {
    render(<ProgressBar value={0.42} showPercentage />);
    expect(screen.getByText('42%')).toBeDefined();
  });

  it('does not show percentage by default', () => {
    const { container } = render(<ProgressBar value={0.42} />);
    expect(container.textContent).not.toContain('42%');
  });

  it('uses aria-label from label prop', () => {
    render(<ProgressBar value={0.5} label="Progress" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('Progress');
  });

  it('falls back to percentage-based aria-label', () => {
    render(<ProgressBar value={0.6} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('60% complete');
  });

  it('sets aria-valuemin and aria-valuemax', () => {
    render(<ProgressBar value={0.5} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('sets the inner bar width to the percentage', () => {
    const { container } = render(<ProgressBar value={0.33} />);
    const innerBar = container.querySelector('[role="progressbar"] > div') as HTMLElement;
    expect(innerBar.style.width).toBe('33%');
  });
});
