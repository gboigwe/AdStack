import { describe, it, expect } from 'vitest';
import {
  validateName,
  validateBudget,
  validateDailyBudget,
  validateDuration,
  validateDescription,
  validateCampaign,
  validateField,
  MAX_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MIN_BUDGET_STX,
  MAX_BUDGET_STX,
} from '@/lib/campaign-validation';

describe('validateName', () => {
  it('rejects empty string', () => {
    expect(validateName('')).toBe('Campaign name is required');
  });

  it('rejects whitespace-only', () => {
    expect(validateName('   ')).toBe('Campaign name is required');
  });

  it('accepts valid names', () => {
    expect(validateName('Q2 Brand Awareness')).toBeNull();
    expect(validateName('Campaign-01')).toBeNull();
    expect(validateName('Test & Launch')).toBeNull();
  });

  it('rejects names exceeding max length', () => {
    const long = 'a'.repeat(MAX_NAME_LENGTH + 1);
    expect(validateName(long)).toContain('64 characters');
  });

  it('rejects names with special characters', () => {
    expect(validateName('Campaign <script>')).toContain('invalid characters');
    expect(validateName('Test/Name')).toContain('invalid characters');
  });
});

describe('validateBudget', () => {
  it('rejects empty input', () => {
    expect(validateBudget('')).toBeTruthy();
  });

  it('rejects zero', () => {
    expect(validateBudget('0')).toBeTruthy();
  });

  it('rejects negative', () => {
    expect(validateBudget('-5')).toBeTruthy();
  });

  it('rejects below minimum', () => {
    expect(validateBudget('0.001')).toContain(`${MIN_BUDGET_STX}`);
  });

  it('rejects above maximum', () => {
    expect(validateBudget('2000000')).toContain('1,000,000');
  });

  it('accepts valid budget', () => {
    expect(validateBudget('100')).toBeNull();
    expect(validateBudget('0.01')).toBeNull();
    expect(validateBudget('999999')).toBeNull();
  });
});

describe('validateDailyBudget', () => {
  it('rejects empty input', () => {
    expect(validateDailyBudget('', '100')).toBeTruthy();
  });

  it('rejects daily budget exceeding total', () => {
    expect(validateDailyBudget('150', '100')).toContain('exceed total');
  });

  it('accepts daily budget within total', () => {
    expect(validateDailyBudget('10', '100')).toBeNull();
  });

  it('accepts equal daily and total budget', () => {
    expect(validateDailyBudget('100', '100')).toBeNull();
  });
});

describe('validateDuration', () => {
  it('rejects empty input', () => {
    expect(validateDuration('')).toBeTruthy();
  });

  it('rejects zero days', () => {
    expect(validateDuration('0')).toContain('between 1 and 365');
  });

  it('rejects over 365 days', () => {
    expect(validateDuration('400')).toContain('between 1 and 365');
  });

  it('accepts valid duration', () => {
    expect(validateDuration('30')).toBeNull();
    expect(validateDuration('1')).toBeNull();
    expect(validateDuration('365')).toBeNull();
  });
});

describe('validateDescription', () => {
  it('accepts empty description', () => {
    expect(validateDescription('')).toBeNull();
  });

  it('accepts description under limit', () => {
    expect(validateDescription('A short description')).toBeNull();
  });

  it('rejects description over limit', () => {
    const long = 'a'.repeat(MAX_DESCRIPTION_LENGTH + 1);
    expect(validateDescription(long)).toContain(`${MAX_DESCRIPTION_LENGTH}`);
  });
});

describe('validateCampaign', () => {
  const validForm = {
    name: 'Test Campaign',
    budget: '100',
    dailyBudget: '10',
    durationDays: '30',
    description: '',
  };

  it('returns empty object for valid form', () => {
    expect(validateCampaign(validForm)).toEqual({});
  });

  it('returns all errors for fully invalid form', () => {
    const errors = validateCampaign({
      name: '',
      budget: '',
      dailyBudget: '',
      durationDays: '',
      description: '',
    });
    expect(errors.name).toBeTruthy();
    expect(errors.budget).toBeTruthy();
    expect(errors.dailyBudget).toBeTruthy();
    expect(errors.durationDays).toBeTruthy();
  });

  it('catches cross-field error: daily × days > total', () => {
    const errors = validateCampaign({
      ...validForm,
      budget: '100',
      dailyBudget: '20',
      durationDays: '10',
    });
    expect(errors.dailyBudget).toContain('exceeds total budget');
  });

  it('skips cross-field check when individual fields have errors', () => {
    const errors = validateCampaign({
      ...validForm,
      budget: '-1',
      dailyBudget: '20',
      durationDays: '10',
    });
    // budget has its own error, so cross-field check shouldn't run
    expect(errors.budget).toBeTruthy();
    expect(errors.dailyBudget).toBeUndefined();
  });
});

describe('validateField', () => {
  it('validates individual name field', () => {
    expect(validateField('name', '')).toBeTruthy();
    expect(validateField('name', 'Valid')).toBeNull();
  });

  it('validates dailyBudget with context', () => {
    const allFields = {
      name: 'Test',
      budget: '100',
      dailyBudget: '200',
      durationDays: '30',
      description: '',
    };
    expect(validateField('dailyBudget', '200', allFields)).toContain('exceed');
  });
});
