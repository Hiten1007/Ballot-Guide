/**
 * @file tests/unit/utils/responseFormatter.test.js
 * @description Unit tests for the response formatter utility.
 */

import { successResponse, errorResponse } from '../../../src/utils/responseFormatter.js';

describe('ResponseFormatter', () => {
  describe('successResponse', () => {
    it('creates correct success envelope', () => {
      const result = successResponse({ items: [1, 2, 3] });
      expect(result.success).toBe(true);
      expect(result.data.items).toEqual([1, 2, 3]);
      expect(result.meta.timestamp).toBeTruthy();
    });

    it('includes custom metadata', () => {
      const result = successResponse('data', { page: 1 });
      expect(result.meta.page).toBe(1);
      expect(result.meta.timestamp).toBeTruthy();
    });
  });

  describe('errorResponse', () => {
    it('creates correct error envelope', () => {
      const result = errorResponse(400, 'Bad request');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe(400);
      expect(result.error.message).toBe('Bad request');
    });

    it('includes details when provided', () => {
      const result = errorResponse(422, 'Validation failed', { field: 'email' });
      expect(result.error.details.field).toBe('email');
    });

    it('excludes details when not provided', () => {
      const result = errorResponse(500, 'Server error');
      expect(result.error.details).toBeUndefined();
    });
  });
});
