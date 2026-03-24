import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormTextarea } from '@/components/forms/FormTextarea';

describe('FormTextarea', () => {
  it('renders label and textarea', () => {
    render(<FormTextarea label="Description" />);
    expect(screen.getByLabelText('Description')).toBeDefined();
    expect(screen.getByLabelText('Description').tagName).toBe('TEXTAREA');
  });

  it('uses custom id when provided', () => {
    render(<FormTextarea label="Bio" id="bio-field" />);
    expect(screen.getByLabelText('Bio').id).toBe('bio-field');
  });

  it('shows required indicator', () => {
    const { container } = render(<FormTextarea label="Message" required />);
    const asterisk = container.querySelector('.text-red-500');
    expect(asterisk?.textContent).toBe('*');
  });

  it('renders error with role="alert"', () => {
    render(<FormTextarea label="Description" error="Too short" />);
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Too short')).toBeDefined();
  });

  it('sets aria-invalid when error exists', () => {
    render(<FormTextarea label="Description" error="Required" />);
    const textarea = screen.getByLabelText('Description');
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
  });

  it('links error via aria-describedby', () => {
    render(<FormTextarea label="Description" id="desc" error="Required" />);
    const textarea = screen.getByLabelText('Description');
    expect(textarea.getAttribute('aria-describedby')).toBe('desc-error');
  });

  it('renders hint text', () => {
    render(<FormTextarea label="Notes" hint="Optional notes" />);
    expect(screen.getByText('Optional notes')).toBeDefined();
  });

  it('hides hint when error is shown', () => {
    render(
      <FormTextarea label="Notes" error="Required" hint="Optional" />,
    );
    expect(screen.queryByText('Optional')).toBeNull();
  });

  it('shows character count when showCount and maxLength are set', () => {
    render(
      <FormTextarea
        label="Bio"
        showCount
        maxLength={200}
        value="Hello"
      />,
    );
    expect(screen.getByText('5/200')).toBeDefined();
  });

  it('shows 0 count when value is empty', () => {
    render(
      <FormTextarea
        label="Bio"
        showCount
        maxLength={100}
        value=""
      />,
    );
    expect(screen.getByText('0/100')).toBeDefined();
  });

  it('does not show count when showCount is false', () => {
    render(
      <FormTextarea label="Bio" maxLength={200} value="Hello" />,
    );
    expect(screen.queryByText('5/200')).toBeNull();
  });

  it('applies error border styles', () => {
    render(<FormTextarea label="Bio" error="Required" />);
    const textarea = screen.getByLabelText('Bio');
    expect(textarea.className).toContain('border-red-300');
  });

  it('applies normal border styles without error', () => {
    render(<FormTextarea label="Bio" />);
    const textarea = screen.getByLabelText('Bio');
    expect(textarea.className).toContain('border-gray-300');
  });
});
