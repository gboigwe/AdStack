'use client';

import { useEffect, useRef } from 'react';

/**
 * Declaratively attach a DOM event listener to a target element.
 *
 * Uses a ref for the handler so the latest closure is always called
 * without re-registering the listener on every render.
 *
 * @param eventName - DOM event name (e.g. 'click', 'keydown', 'resize')
 * @param handler - Event handler function
 * @param element - Target element (defaults to window)
 * @param options - addEventListener options
 *
 * @example
 * useEventListener('keydown', (e) => {
 *   if (e.key === 'Escape') close();
 * });
 *
 * useEventListener('scroll', handleScroll, containerRef.current);
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: HTMLElement | Window | null,
  options?: boolean | AddEventListenerOptions,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const target = element ?? window;
    if (!target?.addEventListener) return;

    const listener = (event: Event) => {
      handlerRef.current(event as WindowEventMap[K]);
    };

    target.addEventListener(eventName, listener, options);
    return () => target.removeEventListener(eventName, listener, options);
  }, [eventName, element, options]);
}
