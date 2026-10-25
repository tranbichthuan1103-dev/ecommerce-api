import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.log(`[Server] E-commerce Monolith MVP is running on http://localhost:${env.port}`);
  console.log(`[Health] Health check endpoint: http://localhost:${env.port}/api/health`);
});

// Xử lý đóng server an toàn (Graceful Shutdown)
const shutdown = (signal) => {
  console.log(`\n[${signal}] Shutting down server gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

