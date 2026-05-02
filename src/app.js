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

  /* ── Security middleware ──────────────────────────────────────── */
  app.use(createSecurityMiddleware());

  /* ── Body parsing ─────────────────────────────────────────────── */
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  /* ── Request logging ──────────────────────────────────────────── */
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });

  /* ── Rate limiting on API routes ──────────────────────────────── */
  app.use('/api', createGlobalLimiter());

  /* ── API routes ───────────────────────────────────────────────── */
  app.use('/api', apiRoutes);

  /* ── Static files (frontend) ──────────────────────────────────── */
  app.use(express.static(join(__dirname, '..', 'public'), {
    maxAge: '1d',
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
