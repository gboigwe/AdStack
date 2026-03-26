// Clarity v4 Contract Argument Validators

export type ValidationResult = { valid: boolean; error?: string };

export function validResult(): ValidationResult {
  return { valid: true };
}

export function invalidResult(error: string): ValidationResult {
  return { valid: false, error };
}
