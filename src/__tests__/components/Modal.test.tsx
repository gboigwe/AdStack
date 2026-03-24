import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

// Stub useFocusTrap – return a plain ref
vi.mock('@/hooks/use-focus-trap', () => ({
  useFocusTrap: () => ({ current: null }),
}));

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <p>Modal body</p>,
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <Modal {...defaultProps} isOpen={false} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders dialog with role and aria-modal', () => {
    render(<Modal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('renders title', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeDefined();
  });

  it('renders children', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Modal body')).toBeDefined();
  });

  it('links title to dialog via aria-labelledby', () => {
    render(<Modal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    const titleId = dialog.getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();
    const heading = screen.getByText('Test Modal');
    expect(heading.id).toBe(titleId);
  });

  it('sets aria-describedby when descriptionId is provided', () => {
    render(<Modal {...defaultProps} descriptionId="desc-1" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-describedby')).toBe('desc-1');
  });

  it('has close button with aria-label', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByLabelText('Close dialog')).toBeDefined();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    // Click the backdrop (the dialog element itself, not inner content)
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when inner content is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Modal body'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('applies default max-w-md', () => {
    render(<Modal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    const inner = dialog.firstElementChild as HTMLElement;
    expect(inner.className).toContain('max-w-md');
  });

  it('applies custom maxWidth', () => {
    render(<Modal {...defaultProps} maxWidth="max-w-2xl" />);
    const dialog = screen.getByRole('dialog');
    const inner = dialog.firstElementChild as HTMLElement;
    expect(inner.className).toContain('max-w-2xl');
  });

  it('prevents body scroll when open', () => {
    render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll on unmount', () => {
    const { unmount } = render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
