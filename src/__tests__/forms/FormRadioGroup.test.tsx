import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormRadioGroup } from '@/components/forms/FormRadioGroup';

const options = [
  { value: 'flat', label: 'Flat Fee', description: 'Fixed payment per campaign' },
  { value: 'cpc', label: 'Cost per Click' },
  { value: 'cpm', label: 'Cost per Mille', disabled: true },
];

describe('FormRadioGroup', () => {
  it('renders legend text', () => {
    render(
      <FormRadioGroup legend="Pricing Model" name="pricing" options={options} />,
    );
    expect(screen.getByText('Pricing Model')).toBeDefined();
  });

  it('renders all radio options', () => {
    render(
      <FormRadioGroup legend="Pricing" name="pricing" options={options} />,
    );
    expect(screen.getByLabelText('Flat Fee')).toBeDefined();
    expect(screen.getByLabelText('Cost per Click')).toBeDefined();
    expect(screen.getByLabelText('Cost per Mille')).toBeDefined();
  });

  it('renders options as radio inputs', () => {
    render(
      <FormRadioGroup legend="Pricing" name="pricing" options={options} />,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(3);
  });

  it('shows required indicator', () => {
    const { container } = render(
      <FormRadioGroup legend="Pricing" name="pricing" options={options} required />,
    );
    const asterisk = container.querySelector('.text-red-500');
    expect(asterisk?.textContent).toBe('*');
  });

  it('renders option description', () => {
    render(
      <FormRadioGroup legend="Pricing" name="pricing" options={options} />,
    );
    expect(screen.getByText('Fixed payment per campaign')).toBeDefined();
  });

  it('marks selected option as checked', () => {
    render(
      <FormRadioGroup legend="Pricing" name="pricing" options={options} value="cpc" />,
    );
    const cpc = screen.getByLabelText('Cost per Click') as HTMLInputElement;
    expect(cpc.checked).toBe(true);
  });

  it('calls onChange when option is clicked', () => {
    const onChange = vi.fn();
    render(
      <FormRadioGroup
        legend="Pricing"
        name="pricing"
        options={options}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Cost per Click'));
    expect(onChange).toHaveBeenCalledWith('cpc');
  });

  it('renders disabled option', () => {
    render(
      <FormRadioGroup legend="Pricing" name="pricing" options={options} />,
    );
    const cpm = screen.getByLabelText('Cost per Mille') as HTMLInputElement;
    expect(cpm.disabled).toBe(true);
  });

  it('renders error with role="alert"', () => {
    render(
      <FormRadioGroup
        legend="Pricing"
        name="pricing"
        options={options}
        error="Please select a pricing model"
      />,
    );
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Please select a pricing model')).toBeDefined();
  });

  it('sets aria-invalid on fieldset when error exists', () => {
    const { container } = render(
      <FormRadioGroup
        legend="Pricing"
        name="pricing"
        options={options}
        error="Required"
      />,
    );
    const fieldset = container.querySelector('fieldset');
    expect(fieldset?.getAttribute('aria-invalid')).toBe('true');
  });

  it('highlights selected option with blue border', () => {
    render(
      <FormRadioGroup legend="Pricing" name="pricing" options={options} value="flat" />,
    );
    const flatOption = screen.getByLabelText('Flat Fee').closest('div[class*="border"]');
    expect(flatOption?.className).toContain('border-blue-500');
  });

  it('merges custom className on fieldset', () => {
    const { container } = render(
      <FormRadioGroup
        legend="Pricing"
        name="pricing"
        options={options}
        className="mt-4"
      />,
    );
    const fieldset = container.querySelector('fieldset');
    expect(fieldset?.className).toContain('mt-4');
  });
});
