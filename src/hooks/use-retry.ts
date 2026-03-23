'use client';

import { useState, useCallback, useRef } from 'react';

interface UseRetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in ms before the first retry (default: 1000) */
  baseDelay?: number;
  /** Multiplier applied to delay after each attempt (default: 2) */
  backoffFactor?: number;
  /** Cap the delay at this value in ms (default: 30000) */
  maxDelay?: number;
  /** Optional predicate — only retry when this returns true */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

interface UseRetryReturn<T> {
  /** Execute the async operation with automatic retry */
  execute: (fn: () => Promise<T>) => Promise<T | undefined>;
  /** Current attempt number (0 = not started) */
  attempt: number;
  /** True while waiting between retries */
  isRetrying: boolean;
  /** True while the operation is in flight */
  isLoading: boolean;
  /** The last error encountered, if any */
  error: unknown;
  /** Cancel a pending retry */
  cancel: () => void;
  /** Reset state for a fresh run */
  reset: () => void;
}

/**
 * Retries an async operation with exponential backoff.
 *
 * @example
 * const { execute, isRetrying, attempt, error } = useRetry({
 *   maxAttempts: 3,
 *   baseDelay: 1000,
 * });
 *
 * const result = await execute(() => fetchBalance(address));
 */
export function useRetry<T = void>(
  options: UseRetryOptions = {},
): UseRetryReturn<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    backoffFactor = 2,
    maxDelay = 30_000,
    shouldRetry,
  } = options;

  const [attempt, setAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    setIsRetrying(false);
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    cancelledRef.current = false;
    setAttempt(0);
    setError(null);
  }, [cancel]);

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T | undefined> => {
      cancelledRef.current = false;
      setError(null);

      for (let i = 0; i <= maxAttempts; i++) {
        if (cancelledRef.current) return undefined;

        setAttempt(i);
        setIsLoading(true);

        try {
          const result = await fn();
          setIsLoading(false);
          setIsRetrying(false);
          return result;
        } catch (err) {
          setError(err);
          setIsLoading(false);

          // Last attempt — don't retry
          if (i >= maxAttempts) {
            setIsRetrying(false);
            return undefined;
          }

          // Check if we should retry
          if (shouldRetry && !shouldRetry(err, i)) {
            setIsRetrying(false);
            return undefined;
          }

          // Wait with exponential backoff
          const delay = Math.min(
            baseDelay * Math.pow(backoffFactor, i),
            maxDelay,
          );

          setIsRetrying(true);
          await new Promise<void>((resolve) => {
            timerRef.current = setTimeout(resolve, delay);
          });
        }
      }

      setIsRetrying(false);
      return undefined;
    },
    [maxAttempts, baseDelay, backoffFactor, maxDelay, shouldRetry],
  );

  return { execute, attempt, isRetrying, isLoading, error, cancel, reset };
}
