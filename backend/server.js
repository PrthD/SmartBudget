import { env } from './src/config/env.js';
import { logger } from './src/config/logger.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { createApp } from './src/app.js';

async function main() {
  await connectDB(env.MONGODB_URI);
  const server = createApp().listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    // Don't hang forever on open keep-alive connections.
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start');
  process.exit(1);
});
