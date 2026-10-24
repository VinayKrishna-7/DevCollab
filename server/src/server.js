import http from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { setupSocketIO } from './sockets/index.js';
import { logger } from './utils/logger.js';
import prisma from './config/prisma.js';

const server = http.createServer(app);

// Initialize Socket.IO
setupSocketIO(server, config.clientUrl);

server.listen(config.port, () => {
  logger.info(`DevCollab API Server running on port ${config.port} (${config.nodeEnv})`);
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Prisma disconnected.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
