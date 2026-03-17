/**
 * Centralized form error messages.
 *
 * Provides consistent, user-friendly error messages used across
 * campaign creation, governance proposal, and publisher settings forms.
 * Using a shared module avoids duplicated strings and makes wording
 * changes a single-file edit.
 */

export const FormErrors = {
  required: (field: string) => `${field} is required`,
  minLength: (field: string, min: number) =>
    `${field} must be at least ${min} characters`,
  maxLength: (field: string, max: number) =>
    `${field} cannot exceed ${max} characters`,
  minValue: (field: string, min: number) =>
    `${field} must be at least ${min}`,
  maxValue: (field: string, max: number) =>
    `${field} cannot exceed ${max}`,
  positiveNumber: (field: string) =>
    `${field} must be a positive number`,
  invalidUrl: 'Enter a valid URL starting with http:// or https://',
  invalidAddress: 'Enter a valid Stacks address (starts with SP or ST)',
  insufficientBalance: (required: string) =>
    `Insufficient balance. You need at least ${required}`,
  networkError: 'A network error occurred. Please try again.',
  generic: 'Something went wrong. Please try again.',
} as const;
