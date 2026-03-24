import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormCheckbox } from '@/components/forms/FormCheckbox';

describe('FormCheckbox', () => {
  it('renders a checkbox with label', () => {
    render(<FormCheckbox label="Accept terms" />);
    expect(screen.getByLabelText('Accept terms')).toBeDefined();
    expect(screen.getByLabelText('Accept terms').getAttribute('type')).toBe('checkbox');
  });

  it('links label to checkbox via htmlFor', () => {
    render(<FormCheckbox label="Newsletter" id="newsletter" />);
    const checkbox = screen.getByLabelText('Newsletter');
    expect(checkbox.id).toBe('newsletter');
  });

  it('shows required indicator', () => {
    const { container } = render(<FormCheckbox label="Agree" required />);
    const asterisk = container.querySelector('.text-red-500');
    expect(asterisk?.textContent).toBe('*');
  });

  it('renders description text', () => {
    render(
      <FormCheckbox
        label="Subscribe"
        description="Get weekly updates via email"
      />,
    );
    expect(screen.getByText('Get weekly updates via email')).toBeDefined();
  });

  it('links description via aria-describedby', () => {
    render(
      <FormCheckbox
        label="Subscribe"
        id="sub"
        description="Weekly updates"
      />,
    );
    const checkbox = screen.getByLabelText('Subscribe');
    expect(checkbox.getAttribute('aria-describedby')).toContain('sub-desc');
  });

  it('renders error message with role="alert"', () => {
    render(<FormCheckbox label="Terms" error="You must accept the terms" />);
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('You must accept the terms')).toBeDefined();
  });

  it('sets aria-invalid when error is present', () => {
    render(<FormCheckbox label="Terms" error="Required" />);
    const checkbox = screen.getByLabelText('Terms');
    expect(checkbox.getAttribute('aria-invalid')).toBe('true');
  });

  it('is not aria-invalid when no error', () => {
    render(<FormCheckbox label="Terms" />);
    const checkbox = screen.getByLabelText('Terms');
    expect(checkbox.getAttribute('aria-invalid')).toBe('false');
  });

  it('applies error border styles', () => {
    render(<FormCheckbox label="Terms" error="Required" />);
    const checkbox = screen.getByLabelText('Terms');
    expect(checkbox.className).toContain('border-red-300');
  });

  it('handles change events', () => {
    const onChange = vi.fn();
    render(<FormCheckbox label="Opt in" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Opt in'));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('can be disabled', () => {
    render(<FormCheckbox label="Disabled" disabled />);
    const checkbox = screen.getByLabelText('Disabled');
    expect(checkbox).toHaveProperty('disabled', true);
  });
});
