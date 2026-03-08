'use client';

import { type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps page content with a subtle fade-in + slide-up animation.
 * Drop this at the top of any page component to get smooth entry.
 */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
}
