import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import type { Express, Request, Response, NextFunction } from 'express';

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
}

export function initSentry(config: SentryConfig): void {
  if (!config.dsn) {
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release || `adstack-backend@${process.env.npm_package_version || '0.0.0'}`,
    tracesSampleRate: config.tracesSampleRate ?? 0.1,
    profilesSampleRate: config.profilesSampleRate ?? 0.1,
    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express(),
      new Sentry.Integrations.Postgres(),
    ],
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }
      return event;
    },
    ignoreErrors: [
      'ECONNRESET',
      'ECONNREFUSED',
      'EPIPE',
      'ETIMEDOUT',
    ],
  });
}

export function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler({
    ip: true,
    user: ['id', 'wallet_address'],
  });
}

export function sentryTracingHandler() {
  return Sentry.Handlers.tracingHandler();
}

export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error: any) {
      const status = error?.status || error?.statusCode || 500;
      return status >= 400;
    },
  });
}

export function setupSentryForExpress(app: Express): void {
  app.use(sentryRequestHandler());
  app.use(sentryTracingHandler());
}

export function setupSentryErrorHandling(app: Express): void {
  app.use(sentryErrorHandler());
}

export function captureException(error: Error, context?: Record<string, any>): void {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

export function setUser(user: { id: string; wallet_address?: string }): void {
  Sentry.setUser(user);
}

export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op });
}

export { Sentry };
