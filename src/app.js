/**
 * @module app
 * @description Express application factory. Assembles middleware, routes,
 * and error handlers into a fully configured Express app. Exported
 * separately from the server for testability.
 */

import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createSecurityMiddleware } from './middleware/security.js';
import { createGlobalLimiter } from './middleware/rateLimiter.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Creates and configures the Express application.
 * @returns {import('express').Application} Configured Express app.
 */
export function createApp() {
  const app = express();

  /* ── Trust proxy for accurate IP behind reverse proxies ───────── */
  app.set('trust proxy', 1);

  /* ── Request correlation ID + response timing ─────────────────── */
  app.use(requestIdMiddleware);

  /* ── Security middleware ──────────────────────────────────────── */
  app.use(createSecurityMiddleware());

  /* ── Body parsing ─────────────────────────────────────────────── */
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  /* ── Request logging with correlation ID ──────────────────────── */
  app.use((req, res, next) => {
    const start = Date.now();

    logger.debug(`→ ${req.method} ${req.path}`, {
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 400 ? 'warn' : 'debug';
      logger[level](`← ${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
        requestId: req.id,
        statusCode: res.statusCode,
        duration,
      });
    });

    next();
  });

  /* ── Rate limiting on API routes ──────────────────────────────── */
  app.use('/api', createGlobalLimiter());

  /* ── API routes ───────────────────────────────────────────────── */
  app.use('/api', apiRoutes);

  /* ── Static files (frontend) ──────────────────────────────────── */
  const isProduction = process.env.NODE_ENV === 'production';
  app.use(express.static(join(__dirname, '..', 'public'), {
    maxAge: isProduction ? '1d' : 0,
    etag: true,
  }));

  /* ── SPA fallback — serve index.html for non-API routes ──────── */
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  });

  /* ── Error handlers (must be last) ────────────────────────────── */
  app.use('/api/*', notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}

export default createApp;
