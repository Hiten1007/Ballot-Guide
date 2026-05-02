/**
 * @module routes/accessibilityRoutes
 * @description Express routes for accessibility features including
 * multi-language translation and text-to-speech. These endpoints
 * ensure the platform is inclusive and usable by all citizens.
 */

import { Router } from 'express';
import { translateText, getSupportedLanguages } from '../services/translateService.js';
import { synthesizeSpeech } from '../services/ttsService.js';
import { validateTranslation, validateTTS } from '../middleware/validator.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * POST /api/accessibility/translate
 * Translates text to the specified language.
 * @name PostTranslate
 */
router.post('/translate', validateTranslation, async (req, res) => {
  try {
    const { text, targetLanguage } = req.sanitisedBody;
    const result = await translateText(text, targetLanguage);
    res.json(successResponse(result));
  } catch (err) {
    logger.error('Translation error', { error: err.message });
    res.status(500).json(errorResponse(500, 'Translation failed.'));
  }
});

/**
 * GET /api/accessibility/languages
 * Returns the list of supported languages for translation.
 * @name GetLanguages
 */
router.get('/languages', async (_req, res) => {
  try {
    const languages = await getSupportedLanguages();
    res.json(successResponse({ languages }));
  } catch (err) {
    logger.error('Languages fetch error', { error: err.message });
    res.status(500).json(errorResponse(500, 'Failed to load supported languages.'));
  }
});

/**
 * POST /api/accessibility/tts
 * Converts text to speech audio.
 * @name PostTTS
 */
router.post('/tts', validateTTS, async (req, res) => {
  try {
    const { text, languageCode } = req.sanitisedBody;
    const result = await synthesizeSpeech(text, languageCode);

    if (result.warning) {
      return res.json(successResponse(result, { warning: result.warning }));
    }

    res.json(successResponse(result));
  } catch (err) {
    logger.error('TTS error', { error: err.message });
    res.status(500).json(errorResponse(500, 'Speech synthesis failed.'));
  }
});

export default router;
