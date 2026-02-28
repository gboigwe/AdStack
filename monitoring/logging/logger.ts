import winston from 'winston';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const PII_PATTERNS = [
  { pattern: /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, replacement: '[EMAIL_REDACTED]' },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD_REDACTED]' },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },
  { pattern: /"password"\s*:\s*"[^"]*"/g, replacement: '"password":"[REDACTED]"' },
  { pattern: /"token"\s*:\s*"[^"]*"/g, replacement: '"token":"[REDACTED]"' },
  { pattern: /"secret"\s*:\s*"[^"]*"/g, replacement: '"secret":"[REDACTED]"' },
  { pattern: /"mnemonic"\s*:\s*"[^"]*"/g, replacement: '"mnemonic":"[REDACTED]"' },
  { pattern: /"privateKey"\s*:\s*"[^"]*"/g, replacement: '"privateKey":"[REDACTED]"' },
];

function maskPII(message: string): string {
  let masked = message;
  for (const { pattern, replacement } of PII_PATTERNS) {
    masked = masked.replace(pattern, replacement);
  }
  return masked;
}

const piiMaskFormat = winston.format((info) => {
  if (typeof info.message === 'string') {
    info.message = maskPII(info.message);
  }
  return info;
});

interface LoggerConfig {
  level?: string;
  service?: string;
  environment?: string;
}

export function createLogger(config: LoggerConfig = {}): winston.Logger {
  const level = config.level || process.env.LOG_LEVEL || 'info';
  const service = config.service || process.env.SERVICE_NAME || 'adstack';
  const environment = config.environment || process.env.NODE_ENV || 'development';

  const transports: winston.transport[] = [];

  if (environment === 'production') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          piiMaskFormat(),
          winston.format.json()
        ),
      })
    );

    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 50 * 1024 * 1024,
        maxFiles: 10,
        format: winston.format.combine(
          winston.format.timestamp(),
          piiMaskFormat(),
          winston.format.json()
        ),
      })
    );

    transports.push(
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 100 * 1024 * 1024,
        maxFiles: 20,
        format: winston.format.combine(
          winston.format.timestamp(),
          piiMaskFormat(),
          winston.format.json()
        ),
      })
    );
  } else {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
            return `${timestamp} [${level}] ${message}${metaStr}`;
          })
        ),
      })
    );
  }

  return winston.createLogger({
    level,
    defaultMeta: { service, environment },
    transports,
  });
}

export function requestLogger(logger: winston.Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    const start = Date.now();

    (req as any).requestId = requestId;
    res.setHeader('x-request-id', requestId);

    const originalEnd = res.end;
    res.end = function (this: Response, ...args: any[]): Response {
      const duration = Date.now() - start;
      const logData = {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        contentLength: res.get('content-length'),
      };

      if (res.statusCode >= 500) {
        logger.error('Request failed', logData);
      } else if (res.statusCode >= 400) {
        logger.warn('Request error', logData);
      } else {
        logger.info('Request completed', logData);
      }

      return originalEnd.apply(this, args as any);
    } as any;

    next();
  };
}

export const logger = createLogger();
