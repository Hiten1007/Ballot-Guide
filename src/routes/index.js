/**
 * @module routes/index
 * @description Route aggregator — mounts all sub-routers under their
 * respective API prefixes and provides a health-check endpoint.
 */

import { Router } from 'express';
import assistantRoutes from './assistantRoutes.js';
import electionRoutes from './electionRoutes.js';
import civicRoutes from './civicRoutes.js';
import accessibilityRoutes from './accessibilityRoutes.js';
import { successResponse } from '../utils/responseFormatter.js';

const router = Router();

/**
 * GET /api/health
 * Simple health-check endpoint for monitoring and load balancers.
 * @name HealthCheck
 */
router.get('/health', (_req, res) => {
  res.json(
    successResponse({
      status: 'healthy',
      uptime: process.uptime(),
      version: '1.0.0',
    }),
  );
});

/* ── Mount sub-routers ──────────────────────────────────────────── */
router.use('/assistant', assistantRoutes);
router.use('/election', electionRoutes);
router.use('/civic', civicRoutes);
router.use('/accessibility', accessibilityRoutes);

export default router;
