// Typed error categories for Stacks integration
export type ErrorCategory = 'network' | 'wallet' | 'contract' | 'validation' | 'auth' | 'unknown';

export interface StacksError {
  category: ErrorCategory;
  code: number;
  message: string;
  raw?: unknown;
}
