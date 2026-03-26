// Retry and backoff utilities for async operations

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 500,
  backoffFactor: 2,
  maxDelayMs: 10_000,
  shouldRetry: () => true,
};

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;
  let delayMs = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt >= opts.maxAttempts || !opts.shouldRetry(e, attempt)) throw e;
      await delay(Math.min(delayMs, opts.maxDelayMs));
      delayMs = Math.min(delayMs * opts.backoffFactor, opts.maxDelayMs);
    }
  }
  throw lastError;
}

export function isRetryableHttpStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}
