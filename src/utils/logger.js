/**
 * @module utils/logger
 * @description Application-wide structured logger built on Winston.
 * Provides JSON-formatted output in production and colourised,
 * human-readable output in development.
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

/**
 * Pretty-print format for development.
 * @type {winston.Logform.Format}
 */
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} ${level}: ${stack || message}${metaStr}`;
  }),
);

/**
 * Structured JSON format for production.
 * @type {winston.Logform.Format}
 */
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

/**
 * Creates and configures the application logger.
 * @returns {winston.Logger} Configured Winston logger instance.
 */
function createLogger() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  return winston.createLogger({
    level: isTest ? 'error' : isProduction ? 'info' : 'debug',
    format: isProduction ? prodFormat : devFormat,
    defaultMeta: { service: 'ballot-guide' },
    transports: [
      new winston.transports.Console({
        silent: isTest,
      }),
    ],
  });
}

/** Singleton logger instance */
const logger = createLogger();

export default logger;
