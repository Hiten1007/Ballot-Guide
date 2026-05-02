/**
 * @file tests/unit/services/geminiService.test.js
 * @description Unit tests for the Gemini AI service with mocked API calls.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

/* Mock the @google/genai module */
const mockGenerateContent = jest.fn();
jest.unstable_mockModule('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

/* Mock config */
jest.unstable_mockModule('../../../src/config/index.js', () => ({
  default: {
    gemini: { apiKey: 'test-key', model: 'gemini-2.5-flash', maxOutputTokens: 2048, temperature: 0.7 },
  },
}));

/* Mock logger */
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

let geminiService;

beforeEach(async () => {
  jest.clearAllMocks();
  geminiService = await import('../../../src/services/geminiService.js');
});

describe('GeminiService', () => {
  describe('chat', () => {
    it('sends a message and returns the AI response', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'The Electoral College has 538 electors.' });

      const result = await geminiService.chat('What is the Electoral College?');
      expect(result).toBe('The Electoral College has 538 electors.');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('includes conversation history in the request', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Great follow-up!' });

      const history = [
        { role: 'user', text: 'Hello' },
        { role: 'model', text: 'Hi there!' },
      ];

      await geminiService.chat('Tell me more', history);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents.length).toBe(3); // 2 history + 1 current
    });

    it('includes context in user message when provided', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'About primaries...' });

      await geminiService.chat('How does this work?', [], 'Primaries & Caucuses');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const lastContent = callArgs.contents[callArgs.contents.length - 1];
      expect(lastContent.parts[0].text).toContain('Primaries & Caucuses');
    });

    it('handles empty response text', async () => {
      mockGenerateContent.mockResolvedValue({ text: '' });
      const result = await geminiService.chat('Test');
      expect(result).toBe('');
    });

    it('propagates API errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API quota exceeded'));
      await expect(geminiService.chat('Test')).rejects.toThrow('API quota exceeded');
    });
  });

  describe('getSuggestions', () => {
    it('returns parsed suggestions array', async () => {
      const suggestions = '["How do primaries work?", "What is a delegate?", "When do primaries happen?", "Who can vote?"]';
      mockGenerateContent.mockResolvedValue({ text: suggestions });

      const result = await geminiService.getSuggestions('Primaries');
      expect(result).toEqual([
        'How do primaries work?',
        'What is a delegate?',
        'When do primaries happen?',
        'Who can vote?',
      ]);
    });

    it('handles markdown code fences in response', async () => {
      mockGenerateContent.mockResolvedValue({ text: '```json\n["Q1", "Q2"]\n```' });
      const result = await geminiService.getSuggestions('Test');
      expect(result).toEqual(['Q1', 'Q2']);
    });

    it('returns empty array when no JSON found in response', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'Not valid JSON' });
      const result = await geminiService.getSuggestions('Test');
      expect(result).toEqual([]);
    });

    it('returns fallback suggestions on JSON parse error', async () => {
      mockGenerateContent.mockResolvedValue({ text: '[not "valid, json]' });
      const result = await geminiService.getSuggestions('Test');
      expect(result).toHaveLength(4);
      expect(result[0]).toBeTruthy();
    });
  });
});
