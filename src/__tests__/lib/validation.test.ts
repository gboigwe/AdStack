import { describe, it, expect } from 'vitest';
import {
  compose,
  required,
  minLength,
  maxLength,
  pattern,
  minValue,
  maxValue,
  positive,
  integer,
  stacksAddress,
  validateForm,
} from '@/lib/validation';

describe('validation', () => {
  describe('required', () => {
    it('returns error for empty string', () => {
      expect(required()('')).toBe('This field is required');
    });

    it('returns error for whitespace-only', () => {
      expect(required()('   ')).toBe('This field is required');
    });

    it('returns undefined for non-empty', () => {
      expect(required()('hello')).toBeUndefined();
    });

    it('accepts custom message', () => {
      expect(required('Name needed')('')).toBe('Name needed');
    });
  });

  describe('minLength', () => {
    it('fails when too short', () => {
      expect(minLength(3)('ab')).toBe('Must be at least 3 characters');
    });

    it('passes at boundary', () => {
      expect(minLength(3)('abc')).toBeUndefined();
    });
  });

  describe('maxLength', () => {
    it('fails when too long', () => {
      expect(maxLength(5)('abcdef')).toBe('Must be at most 5 characters');
    });

    it('passes at boundary', () => {
      expect(maxLength(5)('abcde')).toBeUndefined();
    });
  });

  describe('pattern', () => {
    it('fails when no match', () => {
      expect(pattern(/^\d+$/)('abc')).toBe('Invalid format');
    });

    it('passes when matching', () => {
      expect(pattern(/^\d+$/)('123')).toBeUndefined();
    });

    it('accepts custom message', () => {
      expect(pattern(/^\d+$/, 'Numbers only')('abc')).toBe('Numbers only');
    });
  });

  describe('minValue', () => {
    it('fails below minimum', () => {
      expect(minValue(10)(5)).toBe('Must be at least 10');
    });

    it('passes at minimum', () => {
      expect(minValue(10)(10)).toBeUndefined();
    });
  });

  describe('maxValue', () => {
    it('fails above maximum', () => {
      expect(maxValue(100)(101)).toBe('Must be at most 100');
    });

    it('passes at maximum', () => {
      expect(maxValue(100)(100)).toBeUndefined();
    });
  });

  describe('positive', () => {
    it('fails for zero', () => {
      expect(positive()(0)).toBe('Must be a positive number');
    });

    it('fails for negative', () => {
      expect(positive()(-1)).toBeDefined();
    });

    it('passes for positive', () => {
      expect(positive()(1)).toBeUndefined();
    });
  });

  describe('integer', () => {
    it('fails for decimal', () => {
      expect(integer()(3.14)).toBe('Must be a whole number');
    });

    it('passes for integer', () => {
      expect(integer()(42)).toBeUndefined();
    });
  });

  describe('stacksAddress', () => {
    it('passes for valid SP address', () => {
      expect(stacksAddress()('SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD')).toBeUndefined();
    });

    it('passes for valid ST address', () => {
      expect(stacksAddress()('ST3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD')).toBeUndefined();
    });

    it('fails for short string', () => {
      expect(stacksAddress()('SP123')).toBe('Invalid Stacks address');
    });

    it('returns undefined for empty (let required handle it)', () => {
      expect(stacksAddress()('')).toBeUndefined();
    });
  });

  describe('compose', () => {
    it('returns first error in chain', () => {
      const validate = compose(required('Required'), minLength(3, 'Too short'));
      expect(validate('')).toBe('Required');
    });

    it('returns second error when first passes', () => {
      const validate = compose(required(), minLength(5));
      expect(validate('hi')).toBe('Must be at least 5 characters');
    });

    it('returns undefined when all pass', () => {
      const validate = compose(required(), minLength(2), maxLength(10));
      expect(validate('hello')).toBeUndefined();
    });
  });

  describe('validateForm', () => {
    it('returns errors for invalid fields', () => {
      const errors = validateForm(
        { name: '', budget: -5 },
        { name: required(), budget: positive() },
      );
      expect(errors.name).toBe('This field is required');
      expect(errors.budget).toBe('Must be a positive number');
    });

    it('returns empty object when valid', () => {
      const errors = validateForm(
        { name: 'Test', budget: 100 },
        { name: required(), budget: positive() },
      );
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('only validates fields in schema', () => {
      const errors = validateForm(
        { name: '', extra: '' },
        { name: required() },
      );
      expect(errors.name).toBeDefined();
      expect(errors).not.toHaveProperty('extra');
    });
  });
});
