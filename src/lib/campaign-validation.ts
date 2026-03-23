/**
 * Campaign Validation Rules
 *
 * Centralised validation logic for campaign creation and editing.
 * Returns field-level error messages or null when valid.
 */

export interface CampaignFields {
  name: string;
  budget: string;
  dailyBudget: string;
  durationDays: string;
  description: string;
}

export type CampaignErrors = Partial<Record<keyof CampaignFields, string>>;

/** Maximum characters for a campaign name (stored on-chain) */
export const MAX_NAME_LENGTH = 64;

/** Maximum description length (stored as metadata) */
export const MAX_DESCRIPTION_LENGTH = 500;

/** Min/max budget in STX */
export const MIN_BUDGET_STX = 0.01;
export const MAX_BUDGET_STX = 1_000_000;

/** Min/max duration in days */
export const MIN_DURATION_DAYS = 1;
export const MAX_DURATION_DAYS = 365;

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Campaign name is required';
  if (trimmed.length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or less`;
  if (!/^[\w\s\-&.]+$/.test(trimmed)) return 'Name contains invalid characters';
  return null;
}

export function validateBudget(budget: string): string | null {
  if (!budget) return 'Enter a valid budget amount in STX';
  const value = parseFloat(budget);
  if (isNaN(value) || value <= 0) return 'Enter a valid budget amount in STX';
  if (value < MIN_BUDGET_STX) return `Minimum budget is ${MIN_BUDGET_STX} STX`;
  if (value > MAX_BUDGET_STX) return `Maximum budget is ${MAX_BUDGET_STX.toLocaleString()} STX`;
  return null;
}

export function validateDailyBudget(
  dailyBudget: string,
  totalBudget: string,
): string | null {
  if (!dailyBudget) return 'Enter a valid daily budget in STX';
  const daily = parseFloat(dailyBudget);
  if (isNaN(daily) || daily <= 0) return 'Enter a valid daily budget in STX';

  const total = parseFloat(totalBudget);
  if (!isNaN(total) && daily > total) {
    return 'Daily budget cannot exceed total budget';
  }
  return null;
}

export function validateDuration(durationDays: string): string | null {
  if (!durationDays) return 'Duration is required';
  const days = parseInt(durationDays, 10);
  if (isNaN(days) || days < MIN_DURATION_DAYS || days > MAX_DURATION_DAYS) {
    return `Duration must be between ${MIN_DURATION_DAYS} and ${MAX_DURATION_DAYS} days`;
  }
  return null;
}

export function validateDescription(description: string): string | null {
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`;
  }
  return null;
}

/**
 * Cross-field validation: daily budget × duration should not exceed total budget.
 */
function validateCrossFields(fields: CampaignFields): CampaignErrors {
  const errors: CampaignErrors = {};
  const daily = parseFloat(fields.dailyBudget);
  const total = parseFloat(fields.budget);
  const days = parseInt(fields.durationDays, 10);

  if (!isNaN(daily) && !isNaN(total) && !isNaN(days)) {
    const totalNeeded = daily * days;
    if (totalNeeded > total) {
      errors.dailyBudget =
        `Daily budget × ${days} days = ${totalNeeded.toFixed(2)} STX exceeds total budget`;
    }
  }
  return errors;
}

/**
 * Validate all campaign fields at once.
 * Returns an errors object — empty object means all fields are valid.
 */
export function validateCampaign(fields: CampaignFields): CampaignErrors {
  const errors: CampaignErrors = {};

  const nameError = validateName(fields.name);
  if (nameError) errors.name = nameError;

  const budgetError = validateBudget(fields.budget);
  if (budgetError) errors.budget = budgetError;

  const dailyError = validateDailyBudget(fields.dailyBudget, fields.budget);
  if (dailyError) errors.dailyBudget = dailyError;

  const durationError = validateDuration(fields.durationDays);
  if (durationError) errors.durationDays = durationError;

  const descError = validateDescription(fields.description);
  if (descError) errors.description = descError;

  // Only run cross-field checks if individual fields passed
  if (!errors.budget && !errors.dailyBudget && !errors.durationDays) {
    Object.assign(errors, validateCrossFields(fields));
  }

  return errors;
}

/**
 * Validate a single field (for real-time feedback on blur).
 */
export function validateField(
  field: keyof CampaignFields,
  value: string,
  allFields?: CampaignFields,
): string | null {
  switch (field) {
    case 'name':
      return validateName(value);
    case 'budget':
      return validateBudget(value);
    case 'dailyBudget':
      return validateDailyBudget(value, allFields?.budget ?? '');
    case 'durationDays':
      return validateDuration(value);
    case 'description':
      return validateDescription(value);
    default:
      return null;
  }
}
