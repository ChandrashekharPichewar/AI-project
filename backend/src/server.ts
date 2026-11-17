import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { checkDatabaseConnection } from './config/prisma.js';

async function bootstrap() {
  const app = createApp();

  // Test database connection at startup
  await checkDatabaseConnection();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 AI Knowledge Inbox server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
    logger.info(`📍 Local URL: http://localhost:${env.PORT}`);
    logger.info(`📍 Health Check: http://localhost:${env.PORT}/health`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Initiating graceful shutdown...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });

    // Force shutdown after 10s timeout
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal error during application startup');
  process.exit(1);
});
