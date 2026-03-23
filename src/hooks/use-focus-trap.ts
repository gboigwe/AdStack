'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Hook that traps keyboard focus inside a container element.
 * When active, Tab and Shift+Tab cycle through focusable elements
 * within the container instead of escaping to the page behind it.
 *
 * Useful for modals, dialogs, and drawers to meet WCAG 2.4.3.
 *
 * @param active - Whether the focus trap should be active
 * @returns A ref to attach to the container element
 *
 * @example
 * function Modal({ isOpen }: { isOpen: boolean }) {
 *   const trapRef = useFocusTrap(isOpen);
 *   return isOpen ? <div ref={trapRef}>...</div> : null;
 * }
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  active: boolean,
) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;

    // Focus the first focusable element on activation
    const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusableElements.length > 0) {
      focusableElements[0]?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  return containerRef;
}
