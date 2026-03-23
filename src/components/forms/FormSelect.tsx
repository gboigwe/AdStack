'use client';

import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  function FormSelect(
    { label, error, options, placeholder, className = '', id: externalId, ...props },
    ref,
  ) {
    const autoId = useId();
    const id = externalId ?? autoId;
    const errorId = `${id}-error`;

    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <select
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-gray-100 ${
            error ? 'border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
