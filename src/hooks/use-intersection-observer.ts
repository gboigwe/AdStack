'use client';

import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  /** Root margin for triggering earlier (e.g. '100px' for pre-loading) */
  rootMargin?: string;
  /** Visibility threshold (0-1). Default: 0 (any pixel visible) */
  threshold?: number;
  /** Only trigger once then disconnect */
  triggerOnce?: boolean;
}

/**
 * Track whether an element is visible in the viewport.
 * Useful for lazy loading images, animating on scroll, or
 * deferring expensive renders until the section is in view.
 *
 * @example
 * const { ref, isIntersecting } = useIntersectionObserver({ triggerOnce: true });
 * return <div ref={ref}>{isIntersecting && <ExpensiveChart />}</div>;
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {},
) {
  const { rootMargin = '0px', threshold = 0, triggerOnce = false } = options;
  const ref = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && triggerOnce) {
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold, triggerOnce]);

  return { ref, isIntersecting };
}
