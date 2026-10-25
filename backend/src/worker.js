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

// Graceful shutdown handling
const handleShutdown = (signal) => {
  logger.info(`Worker received ${signal}. Terminating background processes gracefully...`);
  process.exit(0);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
