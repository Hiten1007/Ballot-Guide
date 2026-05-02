/**
 * @module server
 * @description Application entry point. Starts the HTTP server with
 * graceful shutdown handling for both SIGTERM and SIGINT signals.
 */

import { createApp } from './src/app.js';
import config from './src/config/index.js';
import logger from './src/utils/logger.js';

const app = createApp();

const server = app.listen(config.server.port, () => {
  logger.info(`🗳️  BallotGuide server running`, {
    port: config.server.port,
    env: config.server.env,
    url: `http://localhost:${config.server.port}`,
  });
});

/* ── Graceful shutdown ────────────────────────────────────────────── */

/**
 * Handles graceful server shutdown on process signals.
 * @param {string} signal - The signal that triggered shutdown.
 */
function handleShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('Server closed. Goodbye.');
    process.exit(0);
  });

  /* Force shutdown after 10 seconds */
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

export default app;
