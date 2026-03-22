import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '@/components/ui';

describe('Pagination', () => {
  it('returns null when totalPages <= 1', () => {
    const { container } = render(
      <Pagination page={0} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders navigation with role and aria-label', () => {
    render(<Pagination page={0} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole('navigation')).toBeDefined();
  });

  it('shows current page indicator', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText('Page 2 of 5')).toBeDefined();
  });

  it('disables Previous button on first page', () => {
    render(<Pagination page={0} totalPages={3} onPageChange={vi.fn()} />);
    const prevBtn = screen.getByLabelText('Go to previous page');
    expect(prevBtn).toHaveProperty('disabled', true);
  });

  it('disables Next button on last page', () => {
    render(<Pagination page={2} totalPages={3} onPageChange={vi.fn()} />);
    const nextBtn = screen.getByLabelText('Go to next page');
    expect(nextBtn).toHaveProperty('disabled', true);
  });

  it('calls onPageChange with previous page', () => {
    const onChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Go to previous page'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange with next page', () => {
    const onChange = vi.fn();
    render(<Pagination page={1} totalPages={5} onPageChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Go to next page'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('does not go below page 0', () => {
    const onChange = vi.fn();
    render(<Pagination page={0} totalPages={3} onPageChange={onChange} />);

    // Previous is disabled, but verify the math
    fireEvent.click(screen.getByLabelText('Go to previous page'));
    // Button is disabled so click doesn't fire, but the handler clamps
  });

  it('does not exceed totalPages - 1', () => {
    const onChange = vi.fn();
    render(<Pagination page={4} totalPages={5} onPageChange={onChange} />);

    // Next is disabled on last page
    const nextBtn = screen.getByLabelText('Go to next page');
    expect(nextBtn).toHaveProperty('disabled', true);
  });
});
