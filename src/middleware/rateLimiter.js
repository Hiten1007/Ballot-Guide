/**
 * @module middleware/rateLimiter
 * @description Per-route rate limiting using a sliding window algorithm.
 * Protects expensive AI/API endpoints from abuse while keeping
 * static asset serving unrestricted.
 */

import rateLimit from 'express-rate-limit';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Creates the global rate limiter applied to all API routes.
 * @returns {import('express-rate-limit').RateLimitRequestHandler} Rate limiter middleware.
 */
export function createGlobalLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 429,
        message: 'Too many requests. Please try again later.',
      },
    },
    handler: (req, res, _next, options) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
      });
      res.status(429).json(options.message);
    },
  });
}

/**
 * Stricter rate limiter for AI / Gemini endpoints (10 req / min).
 * @returns {import('express-rate-limit').RateLimitRequestHandler} Strict rate limiter.
 */
export function createAiLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 429,
        message: 'AI assistant rate limit reached. Please wait a moment before asking another question.',
      },
    },
  });
}

export default { createGlobalLimiter, createAiLimiter };
