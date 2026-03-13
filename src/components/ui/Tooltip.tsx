'use client';

import { useState, useId, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay in ms before the tooltip appears (default: 200) */
  delay?: number;
}

const POSITION_CLASSES = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
} as const;

const ARROW_CLASSES = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-100 border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-100 border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-100 border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-100 border-y-transparent border-l-transparent',
} as const;

/**
 * Lightweight tooltip that appears on hover/focus with an optional
 * delay. Includes an arrow indicator and full dark mode support.
 *
 * Uses `aria-describedby` to connect the trigger to the tooltip
 * content for screen readers.
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();
  let timer: ReturnType<typeof setTimeout>;

  const show = () => {
    timer = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timer);
    setVisible(false);
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={visible ? tooltipId : undefined}
    >
      {children}
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 whitespace-nowrap rounded bg-gray-900 dark:bg-gray-100 px-2.5 py-1 text-xs text-white dark:text-gray-900 shadow-lg pointer-events-none animate-in fade-in duration-150 ${POSITION_CLASSES[position]}`}
        >
          {content}
          <span
            className={`absolute w-0 h-0 border-4 ${ARROW_CLASSES[position]}`}
          />
        </span>
      )}
    </span>
  );
}
