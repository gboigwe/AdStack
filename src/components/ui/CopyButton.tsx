'use client';

import { useState, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';

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
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for insecure contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors ${className}`}
      title={copied ? 'Copied!' : `Copy ${label || 'to clipboard'}`}
      aria-label={copied ? 'Copied' : `Copy ${label || text}`}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-600" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </button>
  );
}
