'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Debounce delay in ms (0 = no debounce) */
  debounce?: number;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Search input with optional debounce, clear button, and keyboard shortcut.
 *
 * Supports controlled and uncontrolled usage. When debounce > 0,
 * onChange fires after the user stops typing for the specified delay.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  debounce = 300,
  className,
  autoFocus = false,
}: SearchInputProps) {
  const [internal, setInternal] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const display = value ?? internal;

  const emitChange = useCallback(
    (next: string) => {
      if (debounce > 0) {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onChange?.(next), debounce);
      } else {
        onChange?.(next);
      }
    },
    [debounce, onChange],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    if (value === undefined) setInternal(next);
    emitChange(next);
  };

  const handleClear = () => {
    if (value === undefined) setInternal('');
    clearTimeout(timerRef.current);
    onChange?.('');
    inputRef.current?.focus();
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
      <input
        ref={inputRef}
        type="search"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full pl-9 pr-8 py-2 text-sm rounded-lg border',
          'bg-white dark:bg-gray-800',
          'border-gray-300 dark:border-gray-600',
          'text-gray-900 dark:text-gray-100',
          'placeholder:text-gray-400 dark:placeholder:text-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500',
          'dark:focus:ring-blue-400/40 dark:focus:border-blue-400',
        )}
      />
      {display && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
