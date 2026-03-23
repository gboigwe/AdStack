'use client';

import { Check, Copy } from 'lucide-react';
import { useClipboard } from '@/hooks';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

/**
 * A small button that copies text to the clipboard and shows
 * a brief check-mark confirmation. Useful for addresses, tx IDs, etc.
 */
export function CopyButton({ text, label, className = '' }: CopyButtonProps) {
  const { copied, copy } = useClipboard();

  return (
    <button
      onClick={() => copy(text)}
      className={`inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors ${className}`}
      title={copied ? 'Copied!' : `Copy ${label || 'to clipboard'}`}
      aria-label={copied ? 'Copied' : `Copy ${label || text}`}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {label && <span>{copied ? 'Copied' : label}</span>}
      {/* Screen-reader live region for copy confirmation */}
      <span className="sr-only" aria-live="assertive">
        {copied ? `${label || 'Text'} copied to clipboard` : ''}
      </span>
    </button>
  );
}
