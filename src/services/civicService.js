/**
 * @module services/civicService
 * @description Google Civic Information API integration. Provides access
 * to real election data, voter info, and political division lookups.
 */

import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Fetches a list of available elections from the Google Civic API.
 * @returns {Promise<Object>} Election query results.
 * @throws {Error} If the API request fails.
 */
export async function getElections() {
  const url = new URL(`${config.civic.baseUrl}/elections`);
  url.searchParams.set('key', config.civic.apiKey);

  logger.debug('Fetching elections from Civic API');

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Civic API election query failed', {
      status: response.status,
      body: errorBody,
    });
    throw new Error(`Civic API error: ${response.status}`);
  }

  const data = await response.json();

  logger.debug('Elections fetched successfully', {
    count: data.elections?.length || 0,
  });

  return data;
}

/**
 * Looks up voter information for a given address, including polling
 * locations, contests, and election officials.
 * @param {string} address - Sanitised US street address.
 * @param {string} [electionId] - Optional election ID to scope the query.
 * @returns {Promise<Object>} Voter information results.
 * @throws {Error} If the API request fails.
 */
export async function getVoterInfo(address, electionId) {
  const url = new URL(`${config.civic.baseUrl}/voterinfo`);
  url.searchParams.set('key', config.civic.apiKey);
  url.searchParams.set('address', address);

  if (electionId) {
    url.searchParams.set('electionId', electionId);
  }

  logger.debug('Fetching voter info from Civic API', { address });

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Civic API voter info query failed', {
      status: response.status,
      body: errorBody,
    });

    /* 400 often means no elections found for that address */
    if (response.status === 400) {
      return {
        error: 'noElections',
        message: 'No upcoming elections found for this address. Try again closer to an election.',
      };
    }

    throw new Error(`Civic API error: ${response.status}`);
  }

  const data = await response.json();

  logger.debug('Voter info fetched successfully', {
    hasPollingLocations: !!data.pollingLocations,
    contestCount: data.contests?.length || 0,
  });

  return data;
}

/**
 * Searches for political divisions (districts, states, etc.).
 * @param {string} query - Search query for divisions.
 * @returns {Promise<Object>} Division search results.
 * @throws {Error} If the API request fails.
 */
export async function searchDivisions(query) {
  const url = new URL(`${config.civic.baseUrl}/divisions`);
  url.searchParams.set('key', config.civic.apiKey);
  url.searchParams.set('query', query);

  logger.debug('Searching divisions', { query });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Civic API error: ${response.status}`);
  }

  return response.json();
}

export default { getElections, getVoterInfo, searchDivisions };
