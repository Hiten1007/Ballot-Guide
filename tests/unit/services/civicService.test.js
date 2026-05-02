/**
 * @file tests/unit/services/civicService.test.js
 * @description Unit tests for the Civic Information API service.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

/* Mock config */
jest.unstable_mockModule('../../../src/config/index.js', () => ({
  default: {
    civic: { apiKey: 'test-civic-key', baseUrl: 'https://www.googleapis.com/civicinfo/v2' },
  },
}));

/* Mock logger */
jest.unstable_mockModule('../../../src/utils/logger.js', () => ({
  default: { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

let civicService;
const originalFetch = global.fetch;

beforeEach(async () => {
  jest.clearAllMocks();
  civicService = await import('../../../src/services/civicService.js');
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('CivicService', () => {
  describe('getElections', () => {
    it('fetches elections successfully', async () => {
      const mockData = { elections: [{ id: '2000', name: 'US General Election' }] };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await civicService.getElections();
      expect(result.elections).toHaveLength(1);
      expect(result.elections[0].name).toBe('US General Election');
    });

    it('throws on API error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Forbidden'),
      });

      await expect(civicService.getElections()).rejects.toThrow('Civic API error: 403');
    });
  });

  describe('getVoterInfo', () => {
    it('fetches voter info successfully', async () => {
      const mockData = { election: { name: 'Test' }, pollingLocations: [{}] };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await civicService.getVoterInfo('123 Main St');
      expect(result.election.name).toBe('Test');
    });

    it('returns noElections on 400 error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('No elections'),
      });

      const result = await civicService.getVoterInfo('123 Main St');
      expect(result.error).toBe('noElections');
    });

    it('includes electionId when provided', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await civicService.getVoterInfo('123 Main St', '2000');
      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).toContain('electionId=2000');
    });
  });

  describe('searchDivisions', () => {
    it('searches divisions successfully', async () => {
      const mockData = { results: [{ name: 'California' }] };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await civicService.searchDivisions('California');
      expect(result.results[0].name).toBe('California');
    });

    it('throws on API error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(civicService.searchDivisions('test')).rejects.toThrow();
    });
  });
});
