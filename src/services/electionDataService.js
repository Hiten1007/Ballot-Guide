/**
 * @module services/electionDataService
 * @description Serves structured election process data, glossary terms,
 * and quiz questions from local JSON files. Acts as the data access
 * layer with search and filtering capabilities.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');

/** @type {Object|null} Cached election process data */
let processCache = null;

/** @type {Object|null} Cached glossary data */
let glossaryCache = null;

/** @type {Object|null} Cached quiz data */
let quizCache = null;

/** @type {Object|null} Cached facts data */
let factsCache = null;

/**
 * Loads and caches a JSON file from the data directory.
 * @param {string} filename - Name of the JSON file.
 * @returns {Promise<Object>} Parsed JSON data.
 */
async function loadDataFile(filename) {
  const filePath = join(DATA_DIR, filename);
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Returns all election process phases.
 * @returns {Promise<Array>} Array of election process phase objects.
 */
export async function getElectionProcess() {
  if (!processCache) {
    processCache = await loadDataFile('electionProcess.json');
    logger.debug('Election process data loaded', {
      phaseCount: processCache.phases?.length,
    });
  }
  return processCache.phases;
}

/**
 * Returns a specific election process phase by ID.
 * @param {string} phaseId - The phase identifier (e.g., "voter-registration").
 * @returns {Promise<Object|null>} The matching phase or null.
 */
export async function getPhaseById(phaseId) {
  const phases = await getElectionProcess();
  return phases.find((p) => p.id === phaseId) || null;
}

/**
 * Returns all glossary terms, optionally filtered by search query.
 * @param {string} [searchQuery=''] - Optional search string.
 * @returns {Promise<Array>} Filtered array of glossary term objects.
 */
export async function getGlossary(searchQuery = '') {
  if (!glossaryCache) {
    glossaryCache = await loadDataFile('glossary.json');
    logger.debug('Glossary data loaded', {
      termCount: glossaryCache.terms?.length,
    });
  }

  if (!searchQuery) {
    return glossaryCache.terms;
  }

  const query = searchQuery.toLowerCase();
  return glossaryCache.terms.filter(
    (t) =>
      t.term.toLowerCase().includes(query) ||
      t.definition.toLowerCase().includes(query),
  );
}

/**
 * Returns quiz questions, optionally randomised and limited.
 * @param {number} [count] - Number of questions to return.
 * @param {boolean} [shuffle=false] - Whether to randomise order.
 * @returns {Promise<Array>} Array of quiz question objects.
 */
export async function getQuizQuestions(count, shuffle = false) {
  if (!quizCache) {
    quizCache = await loadDataFile('quizQuestions.json');
    logger.debug('Quiz data loaded', {
      questionCount: quizCache.questions?.length,
    });
  }

  let questions = [...quizCache.questions];

  if (shuffle) {
    /* Fisher–Yates shuffle */
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
  }

  if (count && count > 0) {
    questions = questions.slice(0, count);
  }

  return questions;
}

/**
 * Validates a quiz answer.
 * @param {number} questionId - The question ID.
 * @param {number} selectedIndex - The selected answer index.
 * @returns {Promise<Object>} Validation result with correctness and explanation.
 */
export async function validateAnswer(questionId, selectedIndex) {
  const questions = await getQuizQuestions();
  const question = questions.find((q) => q.id === questionId);

  if (!question) {
    return { valid: false, message: 'Question not found.' };
  }

  const isCorrect = question.correctIndex === selectedIndex;

  return {
    valid: true,
    correct: isCorrect,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
  };
}

/**
 * Returns a random election fact for the "Did You Know?" feature.
 * @returns {Promise<Object>} A random fact object with `fact` and `category`.
 */
export async function getRandomFact() {
  if (!factsCache) {
    factsCache = await loadDataFile('electionFacts.json');
    logger.debug('Facts data loaded', { factCount: factsCache.facts?.length });
  }
  const facts = factsCache.facts;
  return facts[Math.floor(Math.random() * facts.length)];
}

/**
 * Returns election countdown data.
 * @returns {Object} Countdown object with days until next major dates.
 */
export function getElectionCountdown() {
  const now = new Date();
  const currentYear = now.getFullYear();

  /* Next presidential election is always the next year divisible by 4 */
  const nextElectionYear = currentYear + (4 - (currentYear % 4)) % 4 || currentYear;
  const electionDay = new Date(`${nextElectionYear}-11-03T00:00:00`);
  const inaugurationDay = new Date(`${nextElectionYear + 1}-01-20T00:00:00`);

  /* Approximate primary season start (Feb of election year) */
  const primaryStart = new Date(`${nextElectionYear}-02-01T00:00:00`);

  /** @param {Date} target */
  const daysUntil = (target) => {
    const diff = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return {
    nextElectionYear,
    electionDay: { date: electionDay.toISOString().split('T')[0], daysUntil: daysUntil(electionDay) },
    inaugurationDay: { date: inaugurationDay.toISOString().split('T')[0], daysUntil: daysUntil(inaugurationDay) },
    primarySeason: { date: primaryStart.toISOString().split('T')[0], daysUntil: daysUntil(primaryStart) },
  };
}

/**
 * Clears all data caches (useful for testing).
 */
export function clearCaches() {
  processCache = null;
  glossaryCache = null;
  quizCache = null;
  factsCache = null;
}

export default {
  getElectionProcess,
  getPhaseById,
  getGlossary,
  getQuizQuestions,
  validateAnswer,
  getRandomFact,
  getElectionCountdown,
  clearCaches,
};
