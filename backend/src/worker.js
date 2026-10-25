import dotenv from 'dotenv';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';

logger.info({
  event: 'WORKER_INITIALIZED',
  environment: NODE_ENV,
  pid: process.pid,
  message: 'Background worker service initialized successfully. Standing by for task dispatch...'
});

// Keep worker event loop alive standing by for background jobs
const heartbeat = setInterval(() => {
  // Worker queue poller / heartbeat
}, 1000 * 60 * 60);

// Graceful shutdown handling
const handleShutdown = (signal) => {
  logger.info(`Worker received ${signal}. Terminating background processes gracefully...`);
  clearInterval(heartbeat);
  process.exit(0);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Worker unhandled rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Worker uncaught exception');
  process.exit(1);
});
