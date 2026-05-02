/**
 * @file api.js
 * @description Centralised API client for all backend communication.
 */

/* eslint-disable no-unused-vars */
// @ts-nocheck

/** Base API URL */
const API_BASE = '/api';

/**
 * Generic fetch wrapper with error handling.
 * @param {string} endpoint - API endpoint path.
 * @param {RequestInit} [options={}] - Fetch options.
 * @returns {Promise<Object>} Parsed response data.
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const res = await fetch(url, config);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data;
}

/** API methods exposed globally */
const BallotAPI = {
  /** Send a chat message to the AI assistant */
  chat: (message, conversationHistory = [], context) =>
    apiFetch('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory, context }),
    }),

  /** Get contextual suggestions */
  suggestions: (section) => apiFetch(`/assistant/suggestions?section=${encodeURIComponent(section)}`),

  /** Get all election process phases */
  getProcess: () => apiFetch('/election/process'),

  /** Get a specific phase */
  getPhase: (id) => apiFetch(`/election/process/${id}`),

  /** Get glossary terms */
  getGlossary: (q = '') => apiFetch(`/election/glossary?q=${encodeURIComponent(q)}`),

  /** Get quiz questions */
  getQuiz: (count, shuffle = true) =>
    apiFetch(`/election/quiz?count=${count || ''}&shuffle=${shuffle}`),

  /** Validate a quiz answer */
  validateAnswer: (questionId, selectedIndex) =>
    apiFetch('/election/quiz/validate', {
      method: 'POST',
      body: JSON.stringify({ questionId, selectedIndex }),
    }),

  /** Get elections from Civic API */
  getElections: () => apiFetch('/civic/elections'),

  /** Get voter info for an address */
  getVoterInfo: (address) => apiFetch(`/civic/voterinfo?address=${encodeURIComponent(address)}`),

  /** Translate text */
  translate: (text, targetLanguage) =>
    apiFetch('/accessibility/translate', {
      method: 'POST',
      body: JSON.stringify({ text, targetLanguage }),
    }),

  /** Text-to-speech */
  tts: (text, languageCode = 'en-US') =>
    apiFetch('/accessibility/tts', {
      method: 'POST',
      body: JSON.stringify({ text, languageCode }),
    }),

  /** Random election fact */
  getRandomFact: () => apiFetch('/election/fact'),

  /** Election countdown data */
  getCountdown: () => apiFetch('/election/countdown'),

  /** Health check */
  health: () => apiFetch('/health'),
};
