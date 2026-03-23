'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface FormCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  description?: string;
}

/**
 * Accessible checkbox with label, optional description, and error state.
 *
 * Uses the same layout patterns as the rest of the form library
 * but with a horizontal label arrangement suited to checkboxes.
 */
export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  function FormCheckbox({ label, error, description, className, id: externalId, ...props }, ref) {
    const autoId = useId();
    const id = externalId ?? autoId;
    const errorId = `${id}-error`;
    const descId = `${id}-desc`;

    return (
      <div>
        <div className="flex items-start gap-3">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            aria-invalid={!!error}
            aria-describedby={
              [description && descId, error && errorId].filter(Boolean).join(' ') || undefined
            }
            className={cn(
              'mt-0.5 h-4 w-4 rounded border transition-colors cursor-pointer',
              'text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              'dark:bg-gray-800 dark:border-gray-600 dark:focus:ring-offset-gray-900',
              error ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600',
              className,
            )}
            {...props}
          />
          <div className="flex-1 min-w-0">
            <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              {label}
              {props.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {description && (
              <p id={descId} className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        {error && (
          <p id={errorId} className="mt-1 ml-7 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
