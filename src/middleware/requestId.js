/**
 * @module middleware/requestId
 * @description Assigns a unique correlation ID to every incoming request.
 * This ID is logged, included in responses via the `X-Request-Id` header,
 * and attached to the request object for downstream tracing.
 */

import { randomUUID } from 'node:crypto';

/**
 * Middleware that adds a unique request ID and response timing.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 */
export function requestIdMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || randomUUID();
  const startTime = process.hrtime.bigint();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  /* Measure response time on finish */
  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - startTime;
    const durationMs = Number(durationNs / 1_000_000n);
    /* Only set if headers haven't been sent (avoids errors in streaming) */
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${durationMs}ms`);
    }
  });

  next();
}

export default requestIdMiddleware;
