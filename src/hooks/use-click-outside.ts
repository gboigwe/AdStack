'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Fires a callback when a click (or touch) occurs outside of the
 * referenced element. Commonly used to close dropdowns, popovers,
 * and context menus.
 *
 * Supports two call signatures:
 *
 * 1. Returns a ref — caller attaches it to a DOM element:
 *    ```ts
 *    const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
 *    return <div ref={ref}>...</div>;
 *    ```
 *
 * 2. Accepts an existing ref — useful when the caller already owns the ref:
 *    ```ts
 *    const menuRef = useRef<HTMLDivElement>(null);
 *    useClickOutside(menuRef, () => setOpen(false));
 *    return <div ref={menuRef}>...</div>;
 *    ```
 */
export function useClickOutside<T extends HTMLElement>(
  handler: () => void,
): RefObject<T | null>;
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
): void;
export function useClickOutside<T extends HTMLElement>(
  refOrHandler: RefObject<T | null> | (() => void),
  maybeHandler?: () => void,
): RefObject<T | null> | void {
  const isRefOverload = typeof refOrHandler !== 'function';
  const externalRef = isRefOverload ? refOrHandler : null;
  const handler = isRefOverload ? maybeHandler! : refOrHandler;

  const internalRef = useRef<T | null>(null);
  const ref = externalRef ?? internalRef;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    function listener(event: MouseEvent | TouchEvent) {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      handlerRef.current();
    }

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref]);

  if (!isRefOverload) return internalRef;
}
