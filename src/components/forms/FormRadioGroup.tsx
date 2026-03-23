'use client';

import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface FormRadioGroupProps {
  legend: string;
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
}

/**
 * Accessible radio button group with fieldset/legend pattern.
 *
 * Supports descriptions per option, error state, and dark mode.
 */
export function FormRadioGroup({
  legend,
  name,
  options,
  value,
  onChange,
  error,
  required,
  className,
}: FormRadioGroupProps) {
  const groupId = useId();
  const errorId = `${groupId}-error`;

  return (
    <fieldset
      className={className}
      aria-invalid={!!error}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {legend}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </legend>

      <div className="space-y-2">
        {options.map((opt) => {
          const optId = `${groupId}-${opt.value}`;
          const descId = `${optId}-desc`;
          const isSelected = value === opt.value;

          return (
            <div
              key={opt.value}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-700'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                opt.disabled && 'opacity-50 cursor-not-allowed',
              )}
              onClick={() => !opt.disabled && onChange?.(opt.value)}
            >
              <input
                type="radio"
                id={optId}
                name={name}
                value={opt.value}
                checked={isSelected}
                disabled={opt.disabled}
                onChange={() => onChange?.(opt.value)}
                aria-describedby={opt.description ? descId : undefined}
                className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-900"
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={optId}
                  className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                >
                  {opt.label}
                </label>
                {opt.description && (
                  <p id={descId} className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {opt.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p id={errorId} className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
