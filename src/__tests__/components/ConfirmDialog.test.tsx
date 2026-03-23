import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// Stub Modal to render children directly so we can test ConfirmDialog in isolation
vi.mock('./Modal', () => ({}));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, children, title, onClose }: any) =>
    isOpen ? (
      <div role="dialog">
        <h2>{title}</h2>
        <button aria-label="Close dialog" onClick={onClose} />
        {children}
      </div>
    ) : null,
}));

// Stub focus trap
vi.mock('@/hooks/use-focus-trap', () => ({
  useFocusTrap: () => ({ current: null }),
}));

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete Campaign',
    message: 'Are you sure you want to delete this campaign?',
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ConfirmDialog {...defaultProps} isOpen={false} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the title', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Delete Campaign')).toBeDefined();
  });

  it('renders the confirmation message', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Are you sure you want to delete this campaign?')).toBeDefined();
  });

  it('shows default button labels', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeDefined();
    expect(screen.getByText('Confirm')).toBeDefined();
  });

  it('shows custom button labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Go Back"
      />,
    );
    expect(screen.getByText('Delete')).toBeDefined();
    expect(screen.getByText('Go Back')).toBeDefined();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows "Processing..." and disables buttons when isLoading', () => {
    render(<ConfirmDialog {...defaultProps} isLoading />);
    expect(screen.getByText('Processing...')).toBeDefined();

    const buttons = screen.getAllByRole('button');
    const cancelBtn = buttons.find((b) => b.textContent === 'Cancel');
    const confirmBtn = buttons.find((b) => b.textContent === 'Processing...');
    expect(cancelBtn).toHaveProperty('disabled', true);
    expect(confirmBtn).toHaveProperty('disabled', true);
  });

  it('applies danger variant styles on confirm button', () => {
    render(<ConfirmDialog {...defaultProps} variant="danger" />);
    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn.className).toContain('bg-red-600');
  });

  it('applies primary variant styles by default', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn.className).toContain('bg-blue-600');
  });
});
