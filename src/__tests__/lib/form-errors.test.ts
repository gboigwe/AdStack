import { describe, it, expect } from 'vitest';
import { FormErrors } from '@/lib/form-errors';

describe('FormErrors', () => {
  it('required includes field name', () => {
    expect(FormErrors.required('Title')).toBe('Title is required');
  });

  it('minLength includes field name and minimum', () => {
    expect(FormErrors.minLength('Name', 5)).toBe('Name must be at least 5 characters');
  });

  it('maxLength includes field name and maximum', () => {
    expect(FormErrors.maxLength('Description', 100)).toBe('Description cannot exceed 100 characters');
  });

  it('minValue includes field name and minimum', () => {
    expect(FormErrors.minValue('Budget', 1)).toBe('Budget must be at least 1');
  });

  it('maxValue includes field name and maximum', () => {
    expect(FormErrors.maxValue('Duration', 30)).toBe('Duration cannot exceed 30');
  });

  it('positiveNumber includes field name', () => {
    expect(FormErrors.positiveNumber('CPM')).toBe('CPM must be a positive number');
  });

  it('invalidUrl is a static string', () => {
    expect(FormErrors.invalidUrl).toBe('Enter a valid URL starting with http:// or https://');
  });

  it('invalidAddress is a static string', () => {
    expect(FormErrors.invalidAddress).toBe('Enter a valid Stacks address (starts with SP or ST)');
  });

  it('insufficientBalance includes required amount', () => {
    expect(FormErrors.insufficientBalance('10 STX')).toBe(
      'Insufficient balance. You need at least 10 STX',
    );
  });

  it('networkError is a static string', () => {
    expect(FormErrors.networkError).toBe('A network error occurred. Please try again.');
  });

  it('generic is a static string', () => {
    expect(FormErrors.generic).toBe('Something went wrong. Please try again.');
  });
});
