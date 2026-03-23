import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormSelect } from '@/components/forms/FormSelect';

const options = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

describe('FormSelect', () => {
  it('renders label and select element', () => {
    render(<FormSelect label="Status" options={options} />);
    expect(screen.getByLabelText('Status')).toBeDefined();
    expect(screen.getByLabelText('Status').tagName).toBe('SELECT');
  });

  it('renders all options', () => {
    render(<FormSelect label="Status" options={options} />);
    expect(screen.getByText('Active')).toBeDefined();
    expect(screen.getByText('Paused')).toBeDefined();
    expect(screen.getByText('Completed')).toBeDefined();
  });

  it('renders placeholder option', () => {
    render(
      <FormSelect label="Status" options={options} placeholder="Select status" />,
    );
    const placeholder = screen.getByText('Select status') as HTMLOptionElement;
    expect(placeholder.disabled).toBe(true);
  });

  it('uses custom id when provided', () => {
    render(<FormSelect label="Status" options={options} id="status-select" />);
    expect(screen.getByLabelText('Status').id).toBe('status-select');
  });

  it('shows required indicator', () => {
    const { container } = render(
      <FormSelect label="Status" options={options} required />,
    );
    const asterisk = container.querySelector('.text-red-500');
    expect(asterisk?.textContent).toBe('*');
  });

  it('renders error with role="alert"', () => {
    render(
      <FormSelect label="Status" options={options} error="Status is required" />,
    );
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Status is required')).toBeDefined();
  });

  it('sets aria-invalid when error is present', () => {
    render(
      <FormSelect label="Status" options={options} error="Required" />,
    );
    const select = screen.getByLabelText('Status');
    expect(select.getAttribute('aria-invalid')).toBe('true');
  });

  it('links error to select via aria-describedby', () => {
    render(
      <FormSelect label="Status" options={options} id="status" error="Required" />,
    );
    const select = screen.getByLabelText('Status');
    expect(select.getAttribute('aria-describedby')).toBe('status-error');
  });

  it('applies error border styles', () => {
    render(
      <FormSelect label="Status" options={options} error="Required" />,
    );
    const select = screen.getByLabelText('Status');
    expect(select.className).toContain('border-red-300');
  });

  it('applies normal border styles without error', () => {
    render(<FormSelect label="Status" options={options} />);
    const select = screen.getByLabelText('Status');
    expect(select.className).toContain('border-gray-300');
  });

  it('handles change events', () => {
    const onChange = vi.fn();
    render(
      <FormSelect label="Status" options={options} onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'paused' },
    });
    expect(onChange).toHaveBeenCalledOnce();
  });
});
