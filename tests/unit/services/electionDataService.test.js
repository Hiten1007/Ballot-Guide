/**
 * @file tests/unit/services/electionDataService.test.js
 * @description Unit tests for the election data service.
 */

import { jest } from '@jest/globals';

/* Reset module cache before imports so caches start clean */
let service;

beforeEach(async () => {
  jest.resetModules();
  const mod = await import('../../../src/services/electionDataService.js');
  service = mod;
  service.clearCaches();
});

describe('ElectionDataService', () => {
  describe('getElectionProcess', () => {
    it('returns an array of election phases', async () => {
      const phases = await service.getElectionProcess();
      expect(Array.isArray(phases)).toBe(true);
      expect(phases.length).toBeGreaterThan(0);
    });

    it('each phase has required fields', async () => {
      const phases = await service.getElectionProcess();
      for (const phase of phases) {
        expect(phase).toHaveProperty('id');
        expect(phase).toHaveProperty('title');
        expect(phase).toHaveProperty('icon');
        expect(phase).toHaveProperty('description');
        expect(phase).toHaveProperty('steps');
        expect(Array.isArray(phase.steps)).toBe(true);
      }
    });

    it('caches data on second call', async () => {
      const first = await service.getElectionProcess();
      const second = await service.getElectionProcess();
      expect(first).toBe(second);
    });
  });

  describe('getPhaseById', () => {
    it('returns the correct phase for a valid ID', async () => {
      const phase = await service.getPhaseById('voter-registration');
      expect(phase).not.toBeNull();
      expect(phase.id).toBe('voter-registration');
      expect(phase.title).toContain('Voter');
    });

    it('returns null for an invalid ID', async () => {
      const phase = await service.getPhaseById('nonexistent-phase');
      expect(phase).toBeNull();
    });
  });

  describe('getGlossary', () => {
    it('returns all terms when no query', async () => {
      const terms = await service.getGlossary();
      expect(Array.isArray(terms)).toBe(true);
      expect(terms.length).toBeGreaterThan(10);
    });

    it('filters terms by search query', async () => {
      const terms = await service.getGlossary('electoral');
      expect(terms.length).toBeGreaterThan(0);
      const match = terms.some(
        (t) =>
          t.term.toLowerCase().includes('electoral') ||
          t.definition.toLowerCase().includes('electoral'),
      );
      expect(match).toBe(true);
    });

    it('returns empty array for no-match query', async () => {
      const terms = await service.getGlossary('xyznonexistent');
      expect(terms).toEqual([]);
    });
  });

  describe('getQuizQuestions', () => {
    it('returns all questions by default', async () => {
      const questions = await service.getQuizQuestions();
      expect(questions.length).toBeGreaterThan(0);
    });

    it('limits question count', async () => {
      const questions = await service.getQuizQuestions(3);
      expect(questions.length).toBe(3);
    });

    it('shuffles questions when requested', async () => {
      const q1 = await service.getQuizQuestions(undefined, false);
      service.clearCaches();
      /* Run shuffle multiple times — at least one should differ */
      let different = false;
      for (let i = 0; i < 5; i++) {
        service.clearCaches();
        const q2 = await service.getQuizQuestions(undefined, true);
        if (q1[0].id !== q2[0].id) {
          different = true;
          break;
        }
      }
      /* Note: with only 12 items, there's a 1/12 chance each time of matching */
      expect(different || q1.length <= 1).toBe(true);
    });

    it('each question has required fields', async () => {
      const questions = await service.getQuizQuestions();
      for (const q of questions) {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('options');
        expect(q).toHaveProperty('correctIndex');
        expect(q).toHaveProperty('explanation');
        expect(q.options.length).toBe(4);
      }
    });
  });

  describe('validateAnswer', () => {
    it('returns correct for the right answer', async () => {
      const questions = await service.getQuizQuestions();
      const q = questions[0];
      const result = await service.validateAnswer(q.id, q.correctIndex);
      expect(result.valid).toBe(true);
      expect(result.correct).toBe(true);
    });

    it('returns incorrect for the wrong answer', async () => {
      const questions = await service.getQuizQuestions();
      const q = questions[0];
      const wrongIndex = (q.correctIndex + 1) % 4;
      const result = await service.validateAnswer(q.id, wrongIndex);
      expect(result.valid).toBe(true);
      expect(result.correct).toBe(false);
      expect(result.explanation).toBeTruthy();
    });

    it('returns invalid for non-existent question', async () => {
      const result = await service.validateAnswer(99999, 0);
      expect(result.valid).toBe(false);
    });
  });
});
