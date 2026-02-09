/**
 * Error Handler Middleware
 *
 * Centralized error handling for the API
 */

import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  details: any;

  constructor(message: string, details?: any) {
    super(message, 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  retryAfter: Date;

  constructor(message: string, retryAfter: Date) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ContractError extends AppError {
  contractName: string;
  functionName: string;

  constructor(message: string, contractName?: string, functionName?: string) {
    super(message, 422);
    this.name = 'ContractError';
    this.contractName = contractName || 'unknown';
    this.functionName = functionName || 'unknown';
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id,
  });

  // If response already sent, delegate to default error handler
  if (res.headersSent) {
    return next(error);
  }

  // Handle known operational errors
  if (error instanceof AppError) {
    const response: any = {
      error: error.name,
      message: error.message,
    };

    // Add additional fields based on error type
    if (error instanceof ValidationError && error.details) {
      response.details = error.details;
    }

    if (error instanceof RateLimitError) {
      response.retryAfter = error.retryAfter;
      res.setHeader('Retry-After', Math.ceil((error.retryAfter.getTime() - Date.now()) / 1000));
    }

    if (error instanceof ContractError) {
      response.contract = error.contractName;
      response.function = error.functionName;
    }

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle specific error types
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token',
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token expired',
    });
    return;
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    res.status(409).json({
      error: 'Conflict',
      message: 'Resource already exists',
    });
    return;
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid reference to related resource',
    });
    return;
  }

  // Handle unknown errors
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    ...(isDevelopment && { stack: error.stack }),
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle uncaught exceptions and unhandled rejections
 */
export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(error.name, error.message);
    console.error(error.stack);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(reason);
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
  });
}
