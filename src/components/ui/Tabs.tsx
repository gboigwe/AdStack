'use client';

import { type ReactNode, useState, useId } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  key: string;
  label: string;
  /** Optional count badge */
  count?: number;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  /** Controlled active tab key (uncontrolled if omitted) */
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

/**
 * Accessible tab component with ARIA roles and keyboard navigation.
 *
 * Supports both controlled and uncontrolled modes. Renders a tab
 * bar with optional count badges and a content panel below.
 */
export function Tabs({ tabs, activeKey, onChange, className }: TabsProps) {
  const [internalKey, setInternalKey] = useState(tabs[0]?.key ?? '');
  const idPrefix = useId();

  const currentKey = activeKey ?? internalKey;
  const activeTab = tabs.find((t) => t.key === currentKey);

  const handleSelect = (key: string) => {
    if (!activeKey) setInternalKey(key);
    onChange?.(key);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const nextTab = tabs[nextIndex];
    if (nextTab) {
      handleSelect(nextTab.key);
      // Focus the target tab button
      const el = document.getElementById(`${idPrefix}-tab-${nextTab.key}`);
      el?.focus();
    }
  };

  return (
    <div className={className}>
      {/* Tab list */}
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto"
      >
        {tabs.map((tab, i) => {
          const isActive = tab.key === currentKey;
          return (
            <button
              key={tab.key}
              id={`${idPrefix}-tab-${tab.key}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${idPrefix}-panel-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleSelect(tab.key)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px',
                isActive
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs rounded-full',
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab panel */}
      {activeTab && (
        <div
          id={`${idPrefix}-panel-${activeTab.key}`}
          role="tabpanel"
          aria-labelledby={`${idPrefix}-tab-${activeTab.key}`}
          tabIndex={0}
          className="py-4"
        >
          {activeTab.content}
        </div>
      )}
    </div>
  );
}
