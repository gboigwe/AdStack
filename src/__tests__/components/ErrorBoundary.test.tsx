import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Component that throws on demand
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test render error');
  }
  return <p>Child content</p>;
}

// Suppress React error boundary console.error noise
const originalError = console.error;

beforeEach(() => {
  console.error = vi.fn();
});

describe('ErrorBoundary', () => {
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>Safe content</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Safe content')).toBeDefined();
  });

  it('shows fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeDefined();
  });

  it('shows custom fallback title', () => {
    render(
      <ErrorBoundary fallbackTitle="Campaign failed to load">
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Campaign failed to load')).toBeDefined();
  });

  it('shows role="alert" in default mode', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('shows "Try Again" button that resets the error', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Try Again')).toBeDefined();
  });

  it('shows hint for render errors', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    );
    expect(
      screen.getByText('An unexpected error occurred. You can try again or refresh the page.'),
    ).toBeDefined();
  });

  it('categorizes network errors correctly', () => {
    function NetworkError() {
      throw new Error('Failed to fetch data from network');
    }

    render(
      <ErrorBoundary>
        <NetworkError />
      </ErrorBoundary>,
    );
    expect(
      screen.getByText('Check your internet connection and try again.'),
    ).toBeDefined();
  });

  it('renders compact mode without description paragraph', () => {
    const { container } = render(
      <ErrorBoundary compact>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    );
    // Compact mode should not have role="alert" div (uses different layout)
    expect(screen.queryByRole('alert')).toBeNull();
    // But should have a retry button
    expect(screen.getByLabelText('Retry')).toBeDefined();
  });

  it('calls onError callback when an error is caught', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test render error');
  });

  it('recovers when retry button is clicked and child stops throwing', () => {
    let shouldThrow = true;

    function ConditionalThrow() {
      if (shouldThrow) throw new Error('Boom');
      return <p>Recovered</p>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeDefined();

    // Fix the error and click retry
    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));

    // Re-render needed since retry resets internal state
    rerender(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Recovered')).toBeDefined();
  });
});
