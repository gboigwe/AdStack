'use client';

import { useState, useCallback, useRef } from 'react';

type Validator<T> = (values: T) => Partial<Record<keyof T, string>>;
type FieldValidator<T> = (
  name: keyof T,
  value: string,
  values: T,
) => string | undefined;

interface UseFormOptions<T extends Record<string, string>> {
  initialValues: T;
  /** Full-form validation, returns a map of field → error */
  validate?: Validator<T>;
  /** Single-field validation for onBlur */
  validateField?: FieldValidator<T>;
  /** Called when validate() passes with zero errors */
  onSubmit: (values: T) => void | Promise<void>;
}

interface UseFormReturn<T extends Record<string, string>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  /** True if any value differs from initial */
  isDirty: boolean;
  /** True while onSubmit promise is pending */
  isSubmitting: boolean;
  /** Standard change handler — reads name/value from the event target */
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  /** Blur handler that runs single-field validation */
  handleBlur: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  /** Submit handler — validates then calls onSubmit */
  handleSubmit: (e: React.FormEvent) => void;
  /** Reset form to initial values and clear errors */
  reset: () => void;
  /** Manually set a field value */
  setFieldValue: (name: keyof T, value: string) => void;
  /** Manually set a field error */
  setFieldError: (name: keyof T, error: string | undefined) => void;
}

/**
 * Lightweight form state hook that manages values, errors,
 * dirty tracking, and the submit lifecycle.
 *
 * @example
 * const { values, errors, handleChange, handleBlur, handleSubmit } = useForm({
 *   initialValues: { name: '', budget: '' },
 *   validate: (v) => validateCampaign(v),
 *   validateField: (name, value, all) => validateField(name, value, all),
 *   onSubmit: (v) => createCampaign(v),
 * });
 */
export function useForm<T extends Record<string, string>>({
  initialValues,
  validate,
  validateField,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialRef = useRef(initialValues);

  const isDirty = Object.keys(initialRef.current).some(
    (key) => values[key as keyof T] !== initialRef.current[key as keyof T],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));
      // Clear error on edit
      setErrors((prev) => {
        if (!prev[name as keyof T]) return prev;
        const next = { ...prev };
        delete next[name as keyof T];
        return next;
      });
    },
    [],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      if (!validateField) return;
      const { name, value } = e.target;
      const error = validateField(name as keyof T, value, values);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [validateField, values],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      // Run full validation if provided
      if (validate) {
        const newErrors = validate(values);
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit, isSubmitting],
  );

  const reset = useCallback(() => {
    setValues(initialRef.current);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  const setFieldValue = useCallback((name: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name: keyof T, error: string | undefined) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  return {
    values,
    errors,
    isDirty,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
  };
}
