/**
 * @file tests/unit/services/translateService.test.js
 * @description Unit tests for the Google Translate service.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

/* Mock config */
jest.unstable_mockModule('../../../src/config/index.js', () => ({
  default: {
    googleCloud: {
      apiKey: 'test-cloud-key',
      translateUrl: 'https://translation.googleapis.com/language/translate/v2',
    },
  },
}));

/* Mock logger */
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

let translateService;
const originalFetch = global.fetch;

beforeEach(async () => {
  jest.clearAllMocks();
  translateService = await import('../../../src/services/translateService.js');
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('TranslateService', () => {
  describe('translateText', () => {
    it('translates text successfully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: { translations: [{ translatedText: 'Hola mundo' }] },
        }),
      });

      const result = await translateService.translateText('Hello world', 'es');
      expect(result.translatedText).toBe('Hola mundo');
    });

    it('throws on API error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Forbidden'),
      });

      await expect(translateService.translateText('Hello', 'es')).rejects.toThrow();
    });
  });

  describe('getSupportedLanguages', () => {
    it('fetches languages from API', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: { languages: [{ language: 'es', name: 'Spanish' }] },
        }),
      });

      const result = await translateService.getSupportedLanguages();
      expect(result[0].language).toBe('es');
    });

    it('returns fallback on API failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false });
      const result = await translateService.getSupportedLanguages();
      expect(result.length).toBeGreaterThan(5);
      expect(result[0]).toHaveProperty('language');
    });
  });
});
