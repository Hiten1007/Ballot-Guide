/**
 * @module routes/assistantRoutes
 * @description Express routes for the AI-powered election education assistant.
 * Handles chat messages and contextual suggestion generation.
 */

import { Router } from 'express';
import { chat, getSuggestions } from '../services/geminiService.js';
import { createAiLimiter } from '../middleware/rateLimiter.js';
import { validateChatMessage } from '../middleware/validator.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * POST /api/assistant/chat
 * Processes a user message through the Gemini AI assistant.
 * @name PostChat
 */
router.post('/chat', createAiLimiter(), validateChatMessage, async (req, res) => {
  try {
    const { message, conversationHistory, context } = req.sanitisedBody;

    const response = await chat(message, conversationHistory, context);

    res.json(
      successResponse({
        reply: response,
        timestamp: new Date().toISOString(),
      }),
    );
  } catch (err) {
    logger.error('Assistant chat error', { error: err.message });
    res.status(500).json(
      errorResponse(500, 'Failed to generate a response. Please try again.'),
    );
  }
});

/**
 * GET /api/assistant/suggestions?section=<sectionId>
 * Returns contextual question suggestions for a given section.
 * @name GetSuggestions
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { section } = req.query;

    if (!section) {
      return res.status(400).json(
        errorResponse(400, 'A "section" query parameter is required.'),
      );
    }

    const suggestions = await getSuggestions(section);

    res.json(successResponse({ suggestions }));
  } catch (err) {
    logger.error('Suggestions error', { error: err.message });
    res.status(500).json(
      errorResponse(500, 'Failed to generate suggestions.'),
    );
  }
});

export default router;
