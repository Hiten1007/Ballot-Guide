/**
 * @module middleware/security
 * @description Applies a defence-in-depth security layer to every request.
 * Combines Helmet (CSP + HSTS + X-Frame), HPP (parameter pollution),
 * CORS, and compression into a single middleware stack.
 */

import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import compression from 'compression';

/**
 * Builds the security middleware array.
 * @returns {import('express').RequestHandler[]} Ordered middleware stack.
 */
export function createSecurityMiddleware() {
  return [
    /* ── Helmet: sets various HTTP security headers ─────────────── */
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
            'https://maps.googleapis.com',
            'https://maps.gstatic.com',
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: [
            "'self'",
            'data:',
            'https://maps.googleapis.com',
            'https://maps.gstatic.com',
            'https://*.tile.openstreetmap.org',
          ],
          connectSrc: [
            "'self'",
            'https://maps.googleapis.com',
            'https://civicinfo.googleapis.com',
          ],
          frameSrc: ['https://www.google.com'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),

    /* ── CORS: restrict to same origin in production ────────────── */
    cors({
      origin: process.env.NODE_ENV === 'production' ? false : '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400,
    }),

    /* ── HPP: prevent HTTP Parameter Pollution ──────────────────── */
    hpp(),

    /* ── Compression: gzip responses above 1 KB ─────────────────── */
    compression({
      threshold: 1024,
      level: 6,
    }),
  ];
}

export default createSecurityMiddleware;
