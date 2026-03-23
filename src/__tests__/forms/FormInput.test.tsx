import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormInput } from '@/components/forms/FormInput';

describe('FormInput', () => {
  it('renders label and input', () => {
    render(<FormInput label="Email" />);
    expect(screen.getByLabelText('Email')).toBeDefined();
  });

  it('links label to input via htmlFor/id', () => {
    render(<FormInput label="Username" />);
    const input = screen.getByLabelText('Username');
    expect(input.tagName).toBe('INPUT');
  });

  it('uses external id when provided', () => {
    render(<FormInput label="Name" id="custom-id" />);
    const input = screen.getByLabelText('Name');
    expect(input.id).toBe('custom-id');
  });

  it('shows required indicator', () => {
    const { container } = render(<FormInput label="Email" required />);
    const asterisk = container.querySelector('.text-red-500');
    expect(asterisk?.textContent).toBe('*');
  });

  it('renders error message with role="alert"', () => {
    render(<FormInput label="Email" error="Email is required" />);
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Email is required')).toBeDefined();
  });

  it('sets aria-invalid when error is present', () => {
    render(<FormInput label="Email" error="Invalid" />);
    const input = screen.getByLabelText('Email');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('sets aria-describedby to error id when error exists', () => {
    render(<FormInput label="Email" id="email" error="Bad email" />);
    const input = screen.getByLabelText('Email');
    expect(input.getAttribute('aria-describedby')).toBe('email-error');
  });

  it('renders hint text', () => {
    render(<FormInput label="Name" hint="Enter your full name" />);
    expect(screen.getByText('Enter your full name')).toBeDefined();
  });

  it('links hint to input via aria-describedby', () => {
    render(<FormInput label="Name" id="name" hint="Full name" />);
    const input = screen.getByLabelText('Name');
    expect(input.getAttribute('aria-describedby')).toBe('name-hint');
  });

  it('hides hint when error is shown', () => {
    render(
      <FormInput label="Email" error="Required" hint="We won't share it" />,
    );
    expect(screen.queryByText("We won't share it")).toBeNull();
  });

  it('applies error border styles', () => {
    render(<FormInput label="Email" error="Required" />);
    const input = screen.getByLabelText('Email');
    expect(input.className).toContain('border-red-300');
  });

  it('applies normal border styles without error', () => {
    render(<FormInput label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input.className).toContain('border-gray-300');
  });

  it('passes HTML attributes through', () => {
    render(<FormInput label="Email" type="email" placeholder="you@example.com" />);
    const input = screen.getByPlaceholderText('you@example.com');
    expect(input.getAttribute('type')).toBe('email');
  });
});
