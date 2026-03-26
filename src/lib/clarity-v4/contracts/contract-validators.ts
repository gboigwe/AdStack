// Clarity v4 Contract Argument Validators

export type ValidationResult = { valid: boolean; error?: string };

export function validResult(): ValidationResult {
  return { valid: true };
}

export function invalidResult(error: string): ValidationResult {
  return { valid: false, error };
}

export function validateUintRange(value: bigint, min: bigint, max: bigint): ValidationResult {
  if (value < min) return invalidResult(`Value ${value} below minimum ${min}`);
  if (value > max) return invalidResult(`Value ${value} exceeds maximum ${max}`);
  return validResult();
}

export function validateNonZero(value: bigint, fieldName: string): ValidationResult {
  if (value === BigInt(0)) return invalidResult(`${fieldName} must be non-zero`);
  return validResult();
}
