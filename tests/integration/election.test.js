/**
 * @file tests/integration/election.test.js
 * @description Integration tests for election API endpoints.
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

describe('Election API', () => {
  describe('GET /api/election/process', () => {
    it('returns all election phases', async () => {
      const res = await request(app).get('/api/election/process');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phases).toBeInstanceOf(Array);
      expect(res.body.data.phases.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/election/process/:phaseId', () => {
    it('returns a specific phase', async () => {
      const res = await request(app).get('/api/election/process/voter-registration');
      expect(res.status).toBe(200);
      expect(res.body.data.phase.id).toBe('voter-registration');
    });

    it('returns 404 for invalid phase', async () => {
      const res = await request(app).get('/api/election/process/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/election/glossary', () => {
    it('returns all glossary terms', async () => {
      const res = await request(app).get('/api/election/glossary');
      expect(res.status).toBe(200);
      expect(res.body.data.terms.length).toBeGreaterThan(0);
      expect(res.body.data.count).toBeGreaterThan(0);
    });

    it('filters terms by query', async () => {
      const res = await request(app).get('/api/election/glossary?q=caucus');
      expect(res.status).toBe(200);
      expect(res.body.data.terms.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/election/quiz', () => {
    it('returns quiz questions without answers', async () => {
      const res = await request(app).get('/api/election/quiz');
      expect(res.status).toBe(200);
      const q = res.body.data.questions[0];
      expect(q.correctIndex).toBeUndefined();
      expect(q.explanation).toBeUndefined();
      expect(q.question).toBeTruthy();
      expect(q.options.length).toBe(4);
    });

    it('limits question count', async () => {
      const res = await request(app).get('/api/election/quiz?count=3');
      expect(res.body.data.questions.length).toBe(3);
    });
  });

  describe('POST /api/election/quiz/validate', () => {
    it('validates a correct answer', async () => {
      const res = await request(app)
        .post('/api/election/quiz/validate')
        .send({ questionId: 1, selectedIndex: 2 });
      expect(res.status).toBe(200);
      expect(res.body.data.correct).toBe(true);
    });

    it('validates an incorrect answer', async () => {
      const res = await request(app)
        .post('/api/election/quiz/validate')
        .send({ questionId: 1, selectedIndex: 0 });
      expect(res.status).toBe(200);
      expect(res.body.data.correct).toBe(false);
      expect(res.body.data.explanation).toBeTruthy();
    });

    it('rejects invalid body', async () => {
      const res = await request(app)
        .post('/api/election/quiz/validate')
        .send({ questionId: 'bad' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/health', () => {
    it('returns healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.data.uptime).toBeGreaterThan(0);
    });

    it('includes X-Request-Id header in response', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  describe('GET /api/election/fact', () => {
    it('returns a random election fact', async () => {
      const res = await request(app).get('/api/election/fact');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fact).toBeTruthy();
      expect(res.body.data.category).toBeTruthy();
    });

    it('returns different facts on multiple calls', async () => {
      const facts = new Set();
      for (let i = 0; i < 10; i++) {
        const res = await request(app).get('/api/election/fact');
        facts.add(res.body.data.fact);
      }
      /* With 15 facts and 10 calls, probability of all same is negligible */
      expect(facts.size).toBeGreaterThan(1);
    });
  });

  describe('GET /api/election/countdown', () => {
    it('returns countdown data with correct structure', async () => {
      const res = await request(app).get('/api/election/countdown');
      expect(res.status).toBe(200);
      expect(res.body.data.nextElectionYear).toBeGreaterThanOrEqual(2026);
      expect(res.body.data.electionDay).toHaveProperty('date');
      expect(res.body.data.electionDay).toHaveProperty('daysUntil');
      expect(res.body.data.inaugurationDay).toHaveProperty('date');
      expect(res.body.data.primarySeason).toHaveProperty('date');
    });

    it('returns non-negative day counts', async () => {
      const res = await request(app).get('/api/election/countdown');
      expect(res.body.data.electionDay.daysUntil).toBeGreaterThanOrEqual(0);
      expect(res.body.data.inaugurationDay.daysUntil).toBeGreaterThanOrEqual(0);
    });
  });
});
