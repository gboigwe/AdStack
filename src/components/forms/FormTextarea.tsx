'use client';

import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Show character count against maxLength. */
  showCount?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea(
    { label, error, hint, showCount = false, className = '', id: externalId, value, ...props },
    ref,
  ) {
    const autoId = useId();
    const id = externalId ?? autoId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {showCount && props.maxLength && (
            <span className="text-xs text-gray-400">
              {charCount}/{props.maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={id}
          value={value}
          aria-invalid={!!error}
          aria-describedby={
            [error && errorId, hint && !error && hintId].filter(Boolean).join(' ') || undefined
          }
          className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y dark:bg-gray-800 dark:text-gray-100 ${
            error ? 'border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
          } ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
