/**
 * @module routes/electionRoutes
 * @description Express routes for election process education data.
 * Serves process phases, glossary terms, and quiz functionality.
 */

import { Router } from 'express';
import {
  getElectionProcess,
  getPhaseById,
  getGlossary,
  getQuizQuestions,
  validateAnswer,
} from '../services/electionDataService.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * GET /api/election/process
 * Returns all election process phases.
 * @name GetProcess
 */
router.get('/process', async (_req, res) => {
  try {
    const phases = await getElectionProcess();
    res.json(successResponse({ phases }));
  } catch (err) {
    logger.error('Error fetching election process', { error: err.message });
    res.status(500).json(errorResponse(500, 'Failed to load election process data.'));
  }
});

/**
 * GET /api/election/process/:phaseId
 * Returns a specific election process phase.
 * @name GetPhase
 */
router.get('/process/:phaseId', async (req, res) => {
  try {
    const phase = await getPhaseById(req.params.phaseId);

    if (!phase) {
      return res.status(404).json(errorResponse(404, 'Election phase not found.'));
    }

    res.json(successResponse({ phase }));
  } catch (err) {
    logger.error('Error fetching phase', { error: err.message });
    res.status(500).json(errorResponse(500, 'Failed to load phase data.'));
  }
});

/**
 * GET /api/election/glossary?q=<search>
 * Returns glossary terms, optionally filtered by search query.
 * @name GetGlossary
 */
router.get('/glossary', async (req, res) => {
  try {
    const terms = await getGlossary(req.query.q || '');
    res.json(successResponse({ terms, count: terms.length }));
  } catch (err) {
    logger.error('Error fetching glossary', { error: err.message });
    res.status(500).json(errorResponse(500, 'Failed to load glossary.'));
  }
});

/**
 * GET /api/election/quiz?count=<n>&shuffle=<bool>
 * Returns quiz questions.
 * @name GetQuiz
 */
router.get('/quiz', async (req, res) => {
  try {
    const count = req.query.count ? parseInt(req.query.count, 10) : undefined;
    const shuffle = req.query.shuffle === 'true';
    const questions = await getQuizQuestions(count, shuffle);

    /* Strip correct answers from the response */
    const sanitised = questions.map(({ correctIndex, explanation, ...q }) => q);

    res.json(successResponse({ questions: sanitised, total: questions.length }));
  } catch (err) {
    logger.error('Error fetching quiz', { error: err.message });
    res.status(500).json(errorResponse(500, 'Failed to load quiz questions.'));
  }
});

/**
 * POST /api/election/quiz/validate
 * Validates a quiz answer.
 * @name ValidateAnswer
 */
router.post('/quiz/validate', async (req, res) => {
  try {
    const { questionId, selectedIndex } = req.body;

    if (typeof questionId !== 'number' || typeof selectedIndex !== 'number') {
      return res.status(400).json(
        errorResponse(400, 'Both "questionId" and "selectedIndex" must be numbers.'),
      );
    }

    const result = await validateAnswer(questionId, selectedIndex);
    res.json(successResponse(result));
  } catch (err) {
    logger.error('Error validating answer', { error: err.message });
    res.status(500).json(errorResponse(500, 'Failed to validate answer.'));
  }
});

export default router;
