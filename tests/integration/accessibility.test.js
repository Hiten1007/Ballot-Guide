/**
 * @file tests/integration/accessibility.test.js
 * @description Tests for accessibility features and HTML structure.
 */

import { jest } from '@jest/globals';

let request;
let app;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.GEMINI_API_KEY = 'test-key';

  const supertest = await import('supertest');
  request = supertest.default;

  const { createApp } = await import('../../src/app.js');
  app = createApp();
});

describe('Accessibility', () => {
  describe('HTML Structure', () => {
    it('serves index.html with proper lang attribute', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('lang="en"');
    });

    it('has a skip navigation link', async () => {
      const res = await request(app).get('/');
      expect(res.text).toContain('skip-link');
      expect(res.text).toContain('Skip to main content');
    });

    it('has proper ARIA roles', async () => {
      const res = await request(app).get('/');
      expect(res.text).toContain('role="banner"');
      expect(res.text).toContain('role="main"');
      expect(res.text).toContain('role="contentinfo"');
      expect(res.text).toContain('role="navigation"');
    });

    it('has proper ARIA labels on interactive elements', async () => {
      const res = await request(app).get('/');
      expect(res.text).toContain('aria-label');
      expect(res.text).toContain('aria-current');
    });

    it('has meta description for SEO', async () => {
      const res = await request(app).get('/');
      expect(res.text).toContain('meta name="description"');
    });

    it('has a single h1 element', async () => {
      const res = await request(app).get('/');
      const h1Matches = res.text.match(/<h1/g);
      expect(h1Matches).not.toBeNull();
      expect(h1Matches.length).toBe(1);
    });
  });

  describe('Translation Endpoint', () => {
    it('rejects missing text', async () => {
      const res = await request(app)
        .post('/api/accessibility/translate')
        .send({ targetLanguage: 'es' });
      expect(res.status).toBe(400);
    });

    it('rejects invalid language code', async () => {
      const res = await request(app)
        .post('/api/accessibility/translate')
        .send({ text: 'Hello', targetLanguage: 'invalid' });
      expect(res.status).toBe(400);
    });
  });

  describe('TTS Endpoint', () => {
    it('rejects missing text', async () => {
      const res = await request(app)
        .post('/api/accessibility/tts')
        .send({});
      expect(res.status).toBe(400);
    });

    it('rejects excessively long text', async () => {
      const res = await request(app)
        .post('/api/accessibility/tts')
        .send({ text: 'a'.repeat(5001) });
      expect(res.status).toBe(400);
    });
  });

  describe('Security Headers', () => {
    it('sets security headers via helmet', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeTruthy();
    });
  });
});
