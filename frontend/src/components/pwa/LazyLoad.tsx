'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface LazyComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export function LazyComponent({
  children,
  fallback,
  rootMargin = '200px',
  threshold = 0,
}: LazyComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={ref}>
      {isVisible ? children : fallback || <div className="min-h-[100px]" />}
    </div>
  );
}

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder,
}: LazyImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = ref.current;
    if (!img) return;

    if ('loading' in HTMLImageElement.prototype) {
      img.loading = 'lazy';
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          img.src = src;
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(img);
    return () => observer.disconnect();
  }, [src]);

  if (error) {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-xs">Failed to load</span>
      </div>
    );
  }

  return (
    <>
      {!loaded && placeholder && (
        <div
          className={`bg-gray-100 animate-pulse ${className}`}
          style={{ width, height }}
        />
      )}
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${!loaded ? 'opacity-0 absolute' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        decoding="async"
      />
    </>
  );
}

export function prefetchRoute(href: string): void {
  if (typeof document === 'undefined') return;

  const existing = document.querySelector(`link[href="${href}"][rel="prefetch"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

export function preconnect(origin: string): void {
  if (typeof document === 'undefined') return;

  const existing = document.querySelector(`link[href="${origin}"][rel="preconnect"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}
