import app from './app';
import { env } from './config/env';
import { prisma } from './database/prisma';
import { initBot } from './modules/notifications/bot';

const PORT = env.PORT;

const startServer = async () => {
  try {
    // Test DB connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Initialize Telegram Bot
    initBot();

    app.listen(PORT, () => {
      console.log(`🚀 Nova English API running on http://localhost:${PORT}`);
      console.log(`📖 Environment: ${env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing server...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
