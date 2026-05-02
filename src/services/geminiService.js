/**
 * @module services/geminiService
 * @description Google Gemini AI integration for the election education
 * chatbot. Uses a carefully crafted system prompt to ensure the AI
 * stays on-topic and provides accurate, nonpartisan civic education.
 */

import { GoogleGenAI } from '@google/genai';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * System prompt that constrains the AI to election education topics.
 * @constant {string}
 */
const SYSTEM_PROMPT = `You are BallotGuide, an expert, nonpartisan election education assistant.
Your purpose is to help users understand the US election process, voter registration, timelines,
and civic participation. Follow these rules strictly:

1. ONLY answer questions about elections, voting, civic processes, and government structure.
2. NEVER express political opinions, endorse candidates, or show party bias.
3. Provide accurate, factual information with context when helpful.
4. If asked about something outside your scope, politely redirect to election topics.
5. Use clear, accessible language suitable for all education levels.
6. When discussing state-specific rules, remind users to verify with their local election office.
7. Encourage civic participation and voter engagement.
8. Cite official sources when possible (e.g., USA.gov, FEC, state election offices).
9. Format responses with markdown for readability (headers, lists, bold text).
10. Keep responses concise but thorough — aim for 150-300 words.`;

/** @type {GoogleGenAI|null} Lazy-initialised client */
let aiClient = null;

/**
 * Returns a singleton GoogleGenAI client, initialising on first call.
 * @returns {GoogleGenAI} The AI client instance.
 */
function getClient() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  }
  return aiClient;
}

/**
 * Sends a message to Gemini and returns the AI response.
 * @param {string} message - The user's question or message.
 * @param {Array<Object>} [conversationHistory=[]] - Prior conversation turns.
 * @param {string} [context] - Optional additional context (e.g., current page).
 * @returns {Promise<string>} The AI-generated response text.
 * @throws {Error} If the API call fails.
 */
export async function chat(message, conversationHistory = [], context) {
  const client = getClient();

  /* Build the contents array with conversation history */
  const contents = [];

  /* Add conversation history for multi-turn context */
  for (const turn of conversationHistory) {
    if (turn.role && turn.text) {
      contents.push({
        role: turn.role === 'user' ? 'user' : 'model',
        parts: [{ text: turn.text }],
      });
    }
  }

  /* Build the current user message with optional context */
  let userMessage = message;
  if (context) {
    userMessage = `[User is currently viewing: ${context}]\n\n${message}`;
  }

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  logger.debug('Sending message to Gemini', {
    messageLength: message.length,
    historyLength: conversationHistory.length,
  });

  const response = await client.models.generateContent({
    model: config.gemini.model,
    contents,
    config: {
      maxOutputTokens: config.gemini.maxOutputTokens,
      temperature: config.gemini.temperature,
      systemInstruction: SYSTEM_PROMPT,
    },
  });

  const text = response.text || '';

  logger.debug('Received Gemini response', {
    responseLength: text.length,
  });

  return text;
}

/**
 * Generates a contextual suggestion based on the user's current section.
 * @param {string} section - The election process section the user is viewing.
 * @returns {Promise<string[]>} Array of suggested questions.
 */
export async function getSuggestions(section) {
  const client = getClient();

  const prompt = `Based on someone learning about "${section}" in the US election process, 
suggest exactly 4 short questions they might want to ask. Return ONLY a JSON array of strings.
Example: ["What is a delegate?", "How do primaries work?"]`;

  const response = await client.models.generateContent({
    model: config.gemini.model,
    contents: prompt,
    config: {
      maxOutputTokens: 256,
      temperature: 0.8,
      systemInstruction: SYSTEM_PROMPT,
    },
  });

  try {
    const text = response.text || '[]';
    /* Extract JSON array from potential markdown code fences */
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    logger.warn('Failed to parse Gemini suggestions', { section });
    return [
      'How does this step work?',
      'Why is this important?',
      'What happens next?',
      'How can I participate?',
    ];
  }
}

export default { chat, getSuggestions };
