/**
 * Composable form validation utilities.
 *
 * Each validator is a function that takes a value and returns an error
 * string if invalid, or undefined if valid. Validators compose via
 * the `compose` helper to build per-field validation chains.
 *
 * @example
 * const nameValidator = compose(
 *   required('Campaign name is required'),
 *   minLength(3, 'Name must be at least 3 characters'),
 *   maxLength(50, 'Name cannot exceed 50 characters'),
 * );
 * const error = nameValidator('');
 * // => 'Campaign name is required'
 */

export type Validator<T = string> = (value: T) => string | undefined;

/** Compose multiple validators — returns the first error encountered. */
export function compose<T>(...validators: Validator<T>[]): Validator<T> {
  return (value: T) => {
    for (const validate of validators) {
      const error = validate(value);
      if (error) return error;
    }
    return undefined;
  };
}

/** Value must be a non-empty string (after trimming). */
export function required(message = 'This field is required'): Validator<string> {
  return (value) => (!value || value.trim().length === 0 ? message : undefined);
}

/** String must have at least `min` characters. */
export function minLength(min: number, message?: string): Validator<string> {
  return (value) =>
    value.length < min
      ? message ?? `Must be at least ${min} characters`
      : undefined;
}

/** String must have at most `max` characters. */
export function maxLength(max: number, message?: string): Validator<string> {
  return (value) =>
    value.length > max
      ? message ?? `Must be at most ${max} characters`
      : undefined;
}

/** String must match the given regular expression. */
export function pattern(regex: RegExp, message = 'Invalid format'): Validator<string> {
  return (value) => (!regex.test(value) ? message : undefined);
}

/** Numeric value must be at least `min`. */
export function minValue(min: number, message?: string): Validator<number> {
  return (value) =>
    value < min
      ? message ?? `Must be at least ${min}`
      : undefined;
}

/** Numeric value must be at most `max`. */
export function maxValue(max: number, message?: string): Validator<number> {
  return (value) =>
    value > max
      ? message ?? `Must be at most ${max}`
      : undefined;
}

/** Value must be a positive number (greater than zero). */
export function positive(message = 'Must be a positive number'): Validator<number> {
  return (value) => (value <= 0 ? message : undefined);
}

/** Value must be an integer. */
export function integer(message = 'Must be a whole number'): Validator<number> {
  return (value) => (!Number.isInteger(value) ? message : undefined);
}

/** String must be a valid Stacks address (starts with SP or ST, 40+ chars). */
export function stacksAddress(message = 'Invalid Stacks address'): Validator<string> {
  return (value) => {
    if (!value) return undefined; // Let `required` handle empty
    const isValid = /^(SP|ST)[A-Z0-9]{39,}$/i.test(value);
    return isValid ? undefined : message;
  };
}

/**
 * Validate an entire form object.
 *
 * Takes a schema mapping field names to validators and returns
 * a mapping of field names to error strings (empty object = valid).
 *
 * @example
 * const errors = validateForm(
 *   { name: 'Hi', budget: -5 },
 *   {
 *     name: compose(required(), minLength(3)),
 *     budget: compose(positive()),
 *   },
 * );
 */
export function validateForm<T extends Record<string, unknown>>(
  values: T,
  schema: Partial<Record<keyof T, Validator<any>>>,
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const key of Object.keys(schema) as Array<keyof T>) {
    const validator = schema[key];
    if (validator) {
      const error = validator(values[key] as any);
      if (error) errors[key] = error;
    }
  }
  return errors;
}
