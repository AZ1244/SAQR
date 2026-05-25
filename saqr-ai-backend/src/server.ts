import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`===========================================================`);
  logger.info(`  SAQR AI - The AI Engineering Brain for GCC Infrastructure`);
  logger.info(`  Server running in [${env.NODE_ENV}] mode on port: ${env.PORT}`);
  logger.info(`  API Base URL: http://localhost:${env.PORT}/api`);
  logger.info(`===========================================================`);
});

process.on('unhandledRejection', (err: any) => {
  logger.error('Unhandled Promise Rejection detected at server level', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
  });
});
