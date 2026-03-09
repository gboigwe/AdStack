'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput({ label, error, hint, className = '', id: externalId, ...props }, ref) {
    const autoId = useId();
    const id = externalId ?? autoId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={
            [error && errorId, hint && !error && hintId].filter(Boolean).join(' ') || undefined
          }
          className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-300'
          } ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
