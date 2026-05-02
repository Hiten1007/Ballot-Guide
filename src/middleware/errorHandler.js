/**
 * @module middleware/errorHandler
 * @description Global Express error handler. Catches both anticipated
 * operational errors and unexpected programmer errors, returning a
 * consistent JSON envelope while logging stack traces in development.
 */

import logger from '../utils/logger.js';
import { errorResponse } from '../utils/responseFormatter.js';

/**
 * Express global error-handling middleware.
 * Must have exactly 4 parameters so Express recognises it as an error handler.
 * @param {Error} err - Caught error.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} _next - Express next (unused but required).
 */
export function globalErrorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  logger.error('Unhandled error', {
    statusCode,
    message: err.message,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  res.status(statusCode).json(
    errorResponse(
      statusCode,
      message,
      process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    ),
  );
}

/**
 * 404 catch-all for undefined API routes.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 */
export function notFoundHandler(req, res) {
  res.status(404).json(
    errorResponse(404, `Route ${req.method} ${req.path} not found.`),
  );
}

export default { globalErrorHandler, notFoundHandler };
