import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security headers with Helmet
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Structured Request Logging Middleware (No PII)
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
      ip: req.ip
    });
  });
  next();
});

// Sanity check health route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// 404 Handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: `Cannot ${req.method} ${req.originalUrl}`,
      statusCode: 404
    }
  });
});

// Centralized 500 Error Middleware
app.use((err, req, res, _next) => {
  const statusCode = err.status || err.statusCode || 500;

  logger.error({
    err: {
      message: err.message,
      stack: NODE_ENV === 'development' ? err.stack : undefined
    },
    method: req.method,
    url: req.originalUrl,
    statusCode
  });

  res.status(statusCode).json({
    error: {
      message: statusCode === 500 && NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message || 'Internal Server Error',
      statusCode
    }
  });
});

// Start listening
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});

// Handle server startup errors (e.g., EADDRINUSE)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Terminate the conflicting process or change PORT in .env.`);
  } else {
    logger.error({ err }, 'Server encountered an error during listen');
  }
  process.exit(1);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown after timeout if pending connections don't close
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled Promise Rejection');
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception');
  process.exit(1);
});

export default app;
