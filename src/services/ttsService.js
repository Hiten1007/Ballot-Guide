/**
 * @module services/ttsService
 * @description Google Cloud Text-to-Speech REST API integration.
 * Provides audio narration of election content for accessibility,
 * supporting visually impaired users and auditory learners.
 */

import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Synthesises speech from text using Google Cloud TTS.
 * @param {string} text - Text to convert to speech.
 * @param {string} [languageCode='en-US'] - BCP-47 language code.
 * @returns {Promise<Object>} Object containing base64-encoded audio content.
 * @throws {Error} If the API request fails or is not configured.
 */
export async function synthesizeSpeech(text, languageCode = 'en-US') {
  if (!config.googleCloud.apiKey) {
    logger.warn('Google Cloud API key not configured for TTS');
    return {
      audioContent: null,
      warning: 'Text-to-speech service not configured. Please add GOOGLE_CLOUD_API_KEY.',
    };
  }

  const url = new URL(config.googleCloud.ttsUrl);
  url.searchParams.set('key', config.googleCloud.apiKey);

  const requestBody = {
    input: { text },
    voice: {
      languageCode,
      ssmlGender: 'NEUTRAL',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.95,
      pitch: 0,
    },
  };

  logger.debug('Synthesizing speech', {
    textLength: text.length,
    languageCode,
  });

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('TTS API failed', {
      status: response.status,
      body: errorBody,
    });
    throw new Error(`TTS API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    audioContent: data.audioContent,
    contentType: 'audio/mp3',
  };
}

export default { synthesizeSpeech };
