'use client';

import { type ReactNode, useState, useRef } from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useClickOutside } from '@/hooks';

interface DropdownItem {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  /** Renders in red for destructive actions */
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownMenuProps {
  items: DropdownItem[];
  /** Custom trigger element (defaults to vertical dots icon) */
  trigger?: ReactNode;
  /** Alignment of the dropdown panel */
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Dropdown menu with click-outside close and keyboard support.
 *
 * Renders an action menu anchored to a trigger button. Supports
 * custom triggers, danger items, and left/right alignment.
 */
export function DropdownMenu({
  items,
  trigger,
  align = 'right',
  className,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsOpen(false));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Actions menu"
      >
        {trigger ?? <MoreVertical className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div
          role="menu"
          onKeyDown={handleKeyDown}
          className={cn(
            'absolute mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => (
            <button
              key={item.key}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                item.danger
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50',
              )}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
