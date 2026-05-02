/**
 * @file tests/unit/middleware/validator.test.js
 * @description Unit tests for request validation middleware.
 */

import {
  validateChatMessage,
  validateAddress,
  validateTranslation,
  validateTTS,
} from '../../../src/middleware/validator.js';

/** Helper to create mock req/res/next */
function createMocks(body = {}, query = {}) {
  const req = { body, query };
  const res = {
    status: function (code) { this.statusCode = code; return this; },
    json: function (data) { this.body = data; return this; },
    statusCode: 200,
    body: null,
  };
  const next = () => { res._nextCalled = true; };
  return { req, res, next };
}

describe('Validator Middleware', () => {
  describe('validateChatMessage', () => {
    it('passes valid message', () => {
      const { req, res, next } = createMocks({ message: 'What is voting?' });
      validateChatMessage(req, res, next);
      expect(res._nextCalled).toBe(true);
      expect(req.sanitisedBody.message).toBe('What is voting?');
    });

    it('rejects missing message', () => {
      const { req, res, next } = createMocks({});
      validateChatMessage(req, res, next);
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects empty string message', () => {
      const { req, res, next } = createMocks({ message: '' });
      validateChatMessage(req, res, next);
      expect(res.statusCode).toBe(400);
    });

    it('rejects overly long message', () => {
      const { req, res, next } = createMocks({ message: 'x'.repeat(2001) });
      validateChatMessage(req, res, next);
      expect(res.statusCode).toBe(400);
    });

    it('strips HTML from message', () => {
      const { req, res, next } = createMocks({ message: '<script>alert("x")</script>Hello' });
      validateChatMessage(req, res, next);
      expect(res._nextCalled).toBe(true);
      expect(req.sanitisedBody.message).toBe('Hello');
    });

    it('limits conversation history to 10 items', () => {
      const history = Array.from({ length: 15 }, (_, i) => ({ role: 'user', text: `msg ${i}` }));
      const { req, res, next } = createMocks({ message: 'hi', conversationHistory: history });
      validateChatMessage(req, res, next);
      expect(req.sanitisedBody.conversationHistory.length).toBe(10);
    });
  });

  describe('validateAddress', () => {
    it('passes valid address', () => {
      const { req, res, next } = createMocks({}, { address: '123 Main St' });
      validateAddress(req, res, next);
      expect(res._nextCalled).toBe(true);
      expect(req.sanitisedAddress).toBe('123 Main St');
    });

    it('rejects missing address', () => {
      const { req, res, next } = createMocks({}, {});
      validateAddress(req, res, next);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('validateTranslation', () => {
    it('passes valid translation request', () => {
      const { req, res, next } = createMocks({ text: 'Hello', targetLanguage: 'es' });
      validateTranslation(req, res, next);
      expect(res._nextCalled).toBe(true);
    });

    it('rejects invalid language code', () => {
      const { req, res, next } = createMocks({ text: 'Hello', targetLanguage: 'invalid-lang' });
      validateTranslation(req, res, next);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('validateTTS', () => {
    it('passes valid TTS request', () => {
      const { req, res, next } = createMocks({ text: 'Read this aloud' });
      validateTTS(req, res, next);
      expect(res._nextCalled).toBe(true);
    });

    it('rejects text exceeding 5000 chars', () => {
      const { req, res, next } = createMocks({ text: 'a'.repeat(5001) });
      validateTTS(req, res, next);
      expect(res.statusCode).toBe(400);
    });
  });
});
