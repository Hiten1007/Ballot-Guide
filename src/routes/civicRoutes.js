/**
 * @module routes/civicRoutes
 * @description Express routes for Google Civic Information API integration.
 * Provides endpoints for election data, voter info, and division lookups.
 */

import { Router } from 'express';
import { getElections, getVoterInfo, searchDivisions } from '../services/civicService.js';
import { validateAddress } from '../middleware/validator.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * GET /api/civic/elections
 * Lists available elections from the Google Civic API.
 * @name GetElections
 */
router.get('/elections', async (_req, res) => {
  try {
    const data = await getElections();
    res.json(successResponse(data));
  } catch (err) {
    logger.error('Civic elections error', { error: err.message });
    res.status(500).json(errorResponse(500, 'Failed to fetch election data.'));
  }
});

/**
 * GET /api/civic/voterinfo?address=<address>
 * Looks up voter information for a given address.
 * @name GetVoterInfo
 */
router.get('/voterinfo', validateAddress, async (req, res) => {
  try {
    const data = await getVoterInfo(
      req.sanitisedAddress,
      req.query.electionId,
    );

    if (data.error === 'noElections') {
      return res.json(successResponse(data, { note: 'No active elections found' }));
    }

    res.json(successResponse(data));
  } catch (err) {
    logger.error('Civic voter info error', { error: err.message });
    res.status(500).json(errorResponse(500, 'Failed to fetch voter information.'));
  }
});

/**
 * GET /api/civic/divisions?q=<query>
 * Searches for political divisions.
 * @name SearchDivisions
 */
router.get('/divisions', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json(errorResponse(400, 'A "q" query parameter is required.'));
    }

    const data = await searchDivisions(q);
    res.json(successResponse(data));
  } catch (err) {
    logger.error('Civic divisions error', { error: err.message });
    res.status(500).json(errorResponse(500, 'Failed to search divisions.'));
  }
});

export default router;
