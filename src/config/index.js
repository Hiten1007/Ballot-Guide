/**
 * @module config
 * @description Centralised application configuration. All environment variables
 * are validated at startup so the server fails fast on misconfiguration rather
 * than encountering cryptic runtime errors downstream.
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Validates that required environment variables are present.
 * @param {string[]} requiredVars - List of required environment variable names.
 * @throws {Error} If any required variable is missing.
 */
function validateEnv(requiredVars) {
  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Please copy .env.example to .env and fill in the values.',
    );
  }
}

/* Only enforce API keys outside of test environments */
if (process.env.NODE_ENV !== 'test') {
  validateEnv(['GEMINI_API_KEY']);
}

/** @type {Readonly<Object>} Frozen configuration object */
const config = Object.freeze({
  /** Server settings */
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },

  /** Google Gemini AI configuration */
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash',
    maxOutputTokens: 2048,
    temperature: 0.7,
  },

  /** Google Civic Information API configuration */
  civic: {
    apiKey: process.env.GOOGLE_CIVIC_API_KEY || '',
    baseUrl: 'https://www.googleapis.com/civicinfo/v2',
  },

  /** Google Cloud services (Translate + TTS) configuration */
  googleCloud: {
    apiKey: process.env.GOOGLE_CLOUD_API_KEY || '',
    translateUrl: 'https://translation.googleapis.com/language/translate/v2',
    ttsUrl: 'https://texttospeech.googleapis.com/v1/text:synthesize',
  },

  /** Rate limiting configuration */
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
});

export default config;
