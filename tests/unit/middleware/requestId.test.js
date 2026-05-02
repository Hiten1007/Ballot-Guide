/**
 * @file tests/unit/middleware/requestId.test.js
 * @description Unit tests for request correlation ID middleware.
 */

import { requestIdMiddleware } from '../../../src/middleware/requestId.js';

describe('RequestId Middleware', () => {
  function createMocks(headers = {}) {
    const req = { headers };
    const res = {
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      listeners: {},
      on(event, cb) { this.listeners[event] = cb; },
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };
    return { req, res, next, wasNextCalled: () => nextCalled };
  }

  it('generates a UUID request ID when none provided', () => {
    const { req, res, next } = createMocks();
    requestIdMiddleware(req, res, next);

    expect(req.id).toBeDefined();
    expect(req.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.headers['X-Request-Id']).toBe(req.id);
  });

  it('uses existing X-Request-Id header if provided', () => {
    const { req, res, next } = createMocks({ 'x-request-id': 'custom-id-123' });
    requestIdMiddleware(req, res, next);

    expect(req.id).toBe('custom-id-123');
    expect(res.headers['X-Request-Id']).toBe('custom-id-123');
  });

  it('calls next()', () => {
    const { req, res, next, wasNextCalled } = createMocks();
    requestIdMiddleware(req, res, next);
    expect(wasNextCalled()).toBe(true);
  });

  it('registers a finish listener for response timing', () => {
    const { req, res, next } = createMocks();
    requestIdMiddleware(req, res, next);
    expect(res.listeners.finish).toBeDefined();
  });
});
