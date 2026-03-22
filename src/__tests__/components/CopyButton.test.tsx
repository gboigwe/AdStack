import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CopyButton } from '@/components/ui/CopyButton';

// Mock the useClipboard hook
const mockCopy = vi.fn();
let mockCopied = false;

vi.mock('@/hooks', () => ({
  useClipboard: () => ({ copied: mockCopied, copy: mockCopy }),
}));

describe('CopyButton', () => {
  beforeEach(() => {
    mockCopy.mockClear();
    mockCopied = false;
  });

  it('renders with copy aria-label using text', () => {
    render(<CopyButton text="SP123ABC" />);
    expect(screen.getByLabelText('Copy SP123ABC')).toBeDefined();
  });

  it('renders with copy aria-label using label when provided', () => {
    render(<CopyButton text="SP123ABC" label="address" />);
    expect(screen.getByLabelText('Copy address')).toBeDefined();
  });

  it('calls copy with the text on click', () => {
    render(<CopyButton text="some-tx-id" />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockCopy).toHaveBeenCalledWith('some-tx-id');
  });

  it('shows label text when label prop is provided', () => {
    render(<CopyButton text="abc" label="Address" />);
    expect(screen.getByText('Address')).toBeDefined();
  });

  it('does not show text label when label prop is omitted', () => {
    const { container } = render(<CopyButton text="abc" />);
    // Only the sr-only span and SVG icon should be present
    const spans = container.querySelectorAll('span:not(.sr-only)');
    expect(spans.length).toBe(0);
  });

  it('shows "Copied" state when copied is true', () => {
    mockCopied = true;
    render(<CopyButton text="abc" label="ID" />);
    expect(screen.getByLabelText('Copied')).toBeDefined();
    expect(screen.getByText('Copied')).toBeDefined();
  });

  it('shows title "Copied!" when copied is true', () => {
    mockCopied = true;
    render(<CopyButton text="abc" />);
    expect(screen.getByTitle('Copied!')).toBeDefined();
  });

  it('shows default title when not copied', () => {
    render(<CopyButton text="abc" />);
    expect(screen.getByTitle('Copy to clipboard')).toBeDefined();
  });

  it('uses label in title when provided and not copied', () => {
    render(<CopyButton text="abc" label="address" />);
    expect(screen.getByTitle('Copy address')).toBeDefined();
  });

  it('has sr-only live region for copy confirmation', () => {
    mockCopied = true;
    const { container } = render(<CopyButton text="abc" label="TX" />);
    const srSpan = container.querySelector('[aria-live="assertive"]');
    expect(srSpan?.textContent).toBe('TX copied to clipboard');
  });

  it('merges custom className', () => {
    const { container } = render(<CopyButton text="x" className="ml-2" />);
    const button = container.querySelector('button') as HTMLElement;
    expect(button.className).toContain('ml-2');
  });
});
