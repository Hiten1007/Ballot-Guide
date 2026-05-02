/**
 * @module services/translateService
 * @description Google Cloud Translation API (v2 REST) integration.
 * Enables multi-language support so non-English speakers can access
 * election education content in their preferred language.
 */

import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Translates text to the specified target language using Google Translate API.
 * @param {string} text - Source text to translate.
 * @param {string} targetLanguage - ISO 639-1 language code (e.g., "es", "fr").
 * @param {string} [sourceLanguage='en'] - Source language code.
 * @returns {Promise<Object>} Translation result with translated text and detected source.
 * @throws {Error} If the API request fails.
 */
export async function translateText(text, targetLanguage, sourceLanguage = 'en') {
  if (!config.googleCloud.apiKey) {
    logger.warn('Google Cloud API key not configured — using passthrough');
    return {
      translatedText: text,
      detectedSourceLanguage: sourceLanguage,
      warning: 'Translation service not configured. Showing original text.',
    };
  }

  const url = new URL(config.googleCloud.translateUrl);
  url.searchParams.set('key', config.googleCloud.apiKey);

  logger.debug('Translating text', {
    targetLanguage,
    textLength: text.length,
  });

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      target: targetLanguage,
      source: sourceLanguage,
      format: 'text',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Translation API failed', {
      status: response.status,
      body: errorBody,
    });
    throw new Error(`Translation API error: ${response.status}`);
  }

  const data = await response.json();
  const translation = data.data?.translations?.[0];

  return {
    translatedText: translation?.translatedText || text,
    detectedSourceLanguage: translation?.detectedSourceLanguage || sourceLanguage,
  };
}

/**
 * Returns a list of supported languages.
 * @returns {Promise<Array>} Array of supported language objects.
 */
export async function getSupportedLanguages() {
  if (!config.googleCloud.apiKey) {
    return getFallbackLanguages();
  }

  const url = new URL(`${config.googleCloud.translateUrl}/languages`);
  url.searchParams.set('key', config.googleCloud.apiKey);
  url.searchParams.set('target', 'en');

  const response = await fetch(url.toString());

  if (!response.ok) {
    logger.warn('Failed to fetch supported languages, using fallback');
    return getFallbackLanguages();
  }

  const data = await response.json();
  return data.data?.languages || getFallbackLanguages();
}

/**
 * Returns a curated fallback list of commonly needed languages.
 * @returns {Array<Object>} Fallback language list.
 */
function getFallbackLanguages() {
  return [
    { language: 'en', name: 'English' },
    { language: 'es', name: 'Spanish' },
    { language: 'zh', name: 'Chinese' },
    { language: 'tl', name: 'Tagalog' },
    { language: 'vi', name: 'Vietnamese' },
    { language: 'ar', name: 'Arabic' },
    { language: 'fr', name: 'French' },
    { language: 'ko', name: 'Korean' },
    { language: 'ru', name: 'Russian' },
    { language: 'pt', name: 'Portuguese' },
    { language: 'hi', name: 'Hindi' },
    { language: 'ja', name: 'Japanese' },
    { language: 'de', name: 'German' },
  ];
}

export default { translateText, getSupportedLanguages };
