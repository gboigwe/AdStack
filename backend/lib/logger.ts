import * as winston from 'winston';
import { config } from '../config/config';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

function getLogLevel(): string {
  const env = config.app?.env || 'development';
  if (env === 'production') return 'info';
  if (env === 'test') return 'error';
  return 'debug';
}

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

const env = config.app?.env || 'development';
if (env === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 10,
    })
  );
}

export const logger = winston.createLogger({
  levels: logLevels,
  level: getLogLevel(),
  transports,
  exitOnError: false,
});

export function httpLogStream() {
  return {
    write: (message: string) => {
      logger.http(message.trim());
    },
  };
}
