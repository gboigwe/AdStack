'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Shown as the heading when an error is caught */
  fallbackTitle?: string;
  /** Compact mode omits the description paragraph */
  compact?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render-time errors in a subtree and shows a
 * recoverable fallback UI instead of unmounting the whole page.
 *
 * Usage:
 *   <ErrorBoundary fallbackTitle="Campaign data failed to load">
 *     <CampaignDetails />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console in development; in production this would
    // forward to an error reporting service.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const {
      fallbackTitle = 'Something went wrong',
      compact = false,
    } = this.props;

    if (compact) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 min-w-0 truncate">{fallbackTitle}</span>
          <button
            onClick={this.handleRetry}
            className="flex-shrink-0 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            aria-label="Retry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <div className="text-center py-12 px-4" role="alert">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {fallbackTitle}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          An unexpected error occurred. You can try again or refresh the page.
        </p>
        <button
          onClick={this.handleRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        {process.env.NODE_ENV === 'development' && this.state.error && (
          <pre className="mt-6 p-4 text-left text-xs bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto max-h-40 text-red-700 dark:text-red-400">
            {this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}
