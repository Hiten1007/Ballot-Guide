/**
 * @module middleware/validator
 * @description Request validation middleware. Each exported function
 * validates a specific request shape and returns 400 with a descriptive
 * message on failure, preventing malformed data from reaching services.
 */

import { sanitizeText, sanitizeAddress } from '../utils/sanitizer.js';
import { errorResponse } from '../utils/responseFormatter.js';

/**
 * Maximum allowed length for chat messages to prevent payload abuse.
 * @constant {number}
 */
const MAX_MESSAGE_LENGTH = 2000;

/**
 * Maximum allowed length for address inputs.
 * @constant {number}
 */
const MAX_ADDRESS_LENGTH = 300;

/**
 * Validates the assistant chat request body.
 * Expects: { message: string, context?: string }
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 */
export function validateChatMessage(req, res, next) {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json(
      errorResponse(400, 'A non-empty "message" string is required.'),
    );
  }

  const sanitised = sanitizeText(message);

  if (sanitised.length === 0) {
    return res.status(400).json(
      errorResponse(400, 'Message cannot be empty after sanitisation.'),
    );
  }

  if (sanitised.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json(
      errorResponse(400, `Message exceeds the maximum length of ${MAX_MESSAGE_LENGTH} characters.`),
    );
  }

  /* Attach sanitised message for downstream handlers */
  req.sanitisedBody = {
    message: sanitised,
    context: req.body.context ? sanitizeText(req.body.context) : undefined,
    conversationHistory: Array.isArray(req.body.conversationHistory)
      ? req.body.conversationHistory.slice(-10)
      : [],
  };

  next();
}

/**
 * Validates an address query parameter.
 * Expects: ?address=<string>
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 */
export function validateAddress(req, res, next) {
  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json(
      errorResponse(400, 'An "address" query parameter is required.'),
    );
  }

  const sanitised = sanitizeAddress(address);

  if (sanitised.length === 0) {
    return res.status(400).json(
      errorResponse(400, 'Address is invalid after sanitisation.'),
    );
  }

  if (sanitised.length > MAX_ADDRESS_LENGTH) {
    return res.status(400).json(
      errorResponse(400, `Address exceeds the maximum length of ${MAX_ADDRESS_LENGTH} characters.`),
    );
  }

  req.sanitisedAddress = sanitised;
  next();
}

/**
 * Validates a translation request body.
 * Expects: { text: string, targetLanguage: string }
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 */
export function validateTranslation(req, res, next) {
  const { text, targetLanguage } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json(
      errorResponse(400, 'A non-empty "text" string is required.'),
    );
  }

  if (!targetLanguage || typeof targetLanguage !== 'string') {
    return res.status(400).json(
      errorResponse(400, 'A "targetLanguage" code is required (e.g. "es", "fr").'),
    );
  }

  /* Language codes are always 2-5 characters (e.g. "en", "zh-CN") */
  if (!/^[a-z]{2}(-[A-Z]{2})?$/i.test(targetLanguage)) {
    return res.status(400).json(
      errorResponse(400, 'Invalid language code format. Use ISO 639-1 (e.g. "es", "fr", "zh-CN").'),
    );
  }

  req.sanitisedBody = {
    text: sanitizeText(text),
    targetLanguage: targetLanguage.toLowerCase(),
  };

  next();
}

/**
 * Validates a text-to-speech request body.
 * Expects: { text: string, languageCode?: string }
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 */
export function validateTTS(req, res, next) {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json(
      errorResponse(400, 'A non-empty "text" string is required for speech synthesis.'),
    );
  }

  const sanitised = sanitizeText(text);

  if (sanitised.length === 0) {
    return res.status(400).json(
      errorResponse(400, 'Text is empty after sanitisation.'),
    );
  }

  if (sanitised.length > 5000) {
    return res.status(400).json(
      errorResponse(400, 'Text exceeds the 5 000 character limit for speech synthesis.'),
    );
  }

  req.sanitisedBody = {
    text: sanitised,
    languageCode: req.body.languageCode || 'en-US',
  };

  next();
}
