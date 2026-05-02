/**
 * @module utils/sanitizer
 * @description Input sanitisation utilities to prevent XSS and injection
 * attacks. All user-supplied text is processed through these helpers
 * before being stored, forwarded to APIs, or rendered.
 */

import sanitizeHtml from 'sanitize-html';

/**
 * Strips ALL HTML tags and attributes from the input string.
 * @param {string} input - Raw user input.
 * @returns {string} Sanitised plain-text string.
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
}

/**
 * Sanitises an object's string properties recursively.
 * Non-string values are passed through unchanged.
 * @param {Object} obj - Object to sanitise.
 * @returns {Object} New object with sanitised string values.
 */
export function sanitizeObject(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'string' ? sanitizeText(item) : sanitizeObject(item),
    );
  }

  const sanitised = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitised[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitised[key] = sanitizeObject(value);
    } else {
      sanitised[key] = value;
    }
  }
  return sanitised;
}

/**
 * Validates and sanitises a US street address string.
 * Allows only alphanumeric characters, spaces, commas, periods,
 * hyphens, and hash signs (for apartment numbers).
 * @param {string} address - Raw address input.
 * @returns {string} Sanitised address safe for API consumption.
 */
export function sanitizeAddress(address) {
  if (typeof address !== 'string') {
    return '';
  }

  return address.replace(/[^a-zA-Z0-9\s,.\-#]/g, '').trim();
}
