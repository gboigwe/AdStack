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

export function validateStringLength(value: string, maxLen: number, fieldName: string): ValidationResult {
  if (value.length > maxLen) return invalidResult(`${fieldName} length ${value.length} exceeds max ${maxLen}`);
  return validResult();
}

export function validateNonEmptyString(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim().length === 0) return invalidResult(`${fieldName} cannot be empty`);
  return validResult();
}

export function combineValidations(...results: ValidationResult[]): ValidationResult {
  for (const r of results) {
    if (!r.valid) return r;
  }
  return validResult();
}

export function validateCampaignBudget(budget: bigint): ValidationResult {
  return combineValidations(
    validateNonZero(budget, 'budget'),
    validateUintRange(budget, BigInt(1_000_000), BigInt('1000000000000'))
  );
}

export function validatePayoutAmount(amount: bigint, budget: bigint): ValidationResult {
  return combineValidations(
    validateNonZero(amount, 'payout amount'),
    amount > budget ? invalidResult('Payout amount exceeds campaign budget') : validResult()
  );
}

export function validateVotingPower(power: bigint, minimum: bigint): ValidationResult {
  if (power < minimum) return invalidResult(`Insufficient voting power: ${power} < ${minimum}`);
  return validResult();
}

export function throwIfInvalid(result: ValidationResult): void {
  if (!result.valid) {
    throw new Error(result.error ?? 'Validation failed');
  }
}

export function validateCampaignDuration(startBlock: bigint, endBlock: bigint): ValidationResult {
  if (endBlock <= startBlock) return invalidResult('End block must be after start block');
  const durationBlocks = endBlock - startBlock;
  if (durationBlocks < BigInt(144)) return invalidResult('Campaign must be at least 1 day');
  if (durationBlocks > BigInt(52560)) return invalidResult('Campaign cannot exceed 1 year');
  return validResult();
}

export function validateImpressionRate(rate: bigint): ValidationResult {
  return combineValidations(
    validateNonZero(rate, 'impression rate'),
    validateUintRange(rate, BigInt(1), BigInt(1_000_000))
  );
}

export function validateField1(value: unknown): ValidationResult {
  if (value === null || value === undefined) return invalidResult('Field 1 is required');
  return validResult();
}

export function validateField2(value: unknown): ValidationResult {
  if (value === null || value === undefined) return invalidResult('Field 2 is required');
  return validResult();
}

export function validateField3(value: unknown): ValidationResult {
  if (value === null || value === undefined) return invalidResult('Field 3 is required');
  return validResult();
}

export function validateField4(value: unknown): ValidationResult {
  if (value === null || value === undefined) return invalidResult('Field 4 is required');
  return validResult();
}

export function validateField5(value: unknown): ValidationResult {
  if (value === null || value === undefined) return invalidResult('Field 5 is required');
  return validResult();
}
