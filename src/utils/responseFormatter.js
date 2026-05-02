/**
 * @module utils/responseFormatter
 * @description Standardised API response formatting. Every endpoint returns
 * a consistent envelope so clients can rely on a predictable schema.
 *
 * Success → { success: true, data, meta }
 * Error   → { success: false, error: { code, message, details? } }
 */

/**
 * Formats a successful API response.
 * @param {*} data - Payload to return.
 * @param {Object} [meta={}] - Optional metadata (pagination, timing, etc.).
 * @returns {Object} Standardised success envelope.
 */
export function successResponse(data, meta = {}) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Formats an error API response.
 * @param {number} code - HTTP status code.
 * @param {string} message - Human-readable error message.
 * @param {*} [details=null] - Optional additional error context.
 * @returns {Object} Standardised error envelope.
 */
export function errorResponse(code, message, details = null) {
  const response = {
    success: false,
    error: {
      code,
      message,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  if (details) {
    response.error.details = details;
  }

  return response;
}
