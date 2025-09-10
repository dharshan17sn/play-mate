import app from './app';
import { config } from './config';
import { database } from './config/database';
import { logger } from './utils/logger';
import { RealtimeService } from './services/realtime';
import { CleanupService } from './services/cleanupService';
import type { Server as HttpServer } from 'http';

const server: HttpServer = app.listen(config.port, async () => {
  try {
    // Connect to database
    await database.connect();
    // Initialize realtime layer
    RealtimeService.initialize(server);
    // Start periodic cleanup tasks (expired tournaments)
    CleanupService.start(5 * 60 * 1000);

    logger.info(`🚀 Server running on port ${config.port}`);
    logger.info(`📊 Environment: ${config.nodeEnv}`);
    logger.info(`🔗 Health check: http://localhost:${config.port}/health`);
    logger.info(`📚 API Base: http://localhost:${config.port}/api/v1`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('📡 HTTP server closed');

    try {
      await database.disconnect();
      logger.info('🗄️ Database disconnected');

      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('⏰ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default server;
