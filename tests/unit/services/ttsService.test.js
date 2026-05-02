/**
 * @file tests/unit/services/ttsService.test.js
 * @description Unit tests for the Text-to-Speech service.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

/* Mock config */
jest.unstable_mockModule('../../../src/config/index.js', () => ({
  default: {
    googleCloud: {
      apiKey: 'test-cloud-key',
      ttsUrl: 'https://texttospeech.googleapis.com/v1/text:synthesize',
    },
  },
}));

/* Mock logger */
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

let ttsService;
const originalFetch = global.fetch;

beforeEach(async () => {
  jest.clearAllMocks();
  ttsService = await import('../../../src/services/ttsService.js');
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('TTSService', () => {
  describe('synthesizeSpeech', () => {
    it('synthesises speech successfully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ audioContent: 'base64audiodata' }),
      });

      const result = await ttsService.synthesizeSpeech('Hello world');
      expect(result.audioContent).toBe('base64audiodata');
      expect(result.contentType).toBe('audio/mp3');
    });

    it('sends correct request body', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ audioContent: 'data' }),
      });

      await ttsService.synthesizeSpeech('Test text', 'es-ES');

      const callArgs = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callArgs.input.text).toBe('Test text');
      expect(callArgs.voice.languageCode).toBe('es-ES');
      expect(callArgs.audioConfig.audioEncoding).toBe('MP3');
    });

    it('throws on API error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error'),
      });

      await expect(ttsService.synthesizeSpeech('Test')).rejects.toThrow('TTS API error: 500');
    });
  });
});
