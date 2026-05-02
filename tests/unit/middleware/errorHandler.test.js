/**
 * @file tests/unit/middleware/errorHandler.test.js
 * @description Unit tests for global error handling middleware.
 */

import { jest } from '@jest/globals';

/* Mock logger */
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: { error: jest.fn(), warn: jest.fn(), debug: jest.fn(), info: jest.fn() },
}));

let globalErrorHandler, notFoundHandler;

beforeAll(async () => {
  const mod = await import('../../../src/middleware/errorHandler.js');
  globalErrorHandler = mod.globalErrorHandler;
  notFoundHandler = mod.notFoundHandler;
});

describe('ErrorHandler', () => {
  function createMocks() {
    return {
      req: { path: '/test', method: 'GET' },
      res: {
        statusCode: 200,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; },
      },
      next: () => {},
    };
  }

  describe('globalErrorHandler', () => {
    it('returns 500 for errors without statusCode', () => {
      const { req, res, next } = createMocks();
      const err = new Error('Something broke');

      globalErrorHandler(err, req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Internal server error');
    });

    it('returns custom statusCode when provided', () => {
      const { req, res, next } = createMocks();
      const err = new Error('Not found');
      err.statusCode = 404;

      globalErrorHandler(err, req, res, next);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.message).toBe('Not found');
    });

    it('hides error details in production', () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const { req, res, next } = createMocks();
      const err = new Error('Secret error');

      globalErrorHandler(err, req, res, next);

      expect(res.body.error.details).toBeUndefined();
      process.env.NODE_ENV = original;
    });
  });

  describe('notFoundHandler', () => {
    it('returns 404 with route info', () => {
      const { req, res } = createMocks();

      notFoundHandler(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.error.message).toContain('GET');
      expect(res.body.error.message).toContain('/test');
    });
  });
});
