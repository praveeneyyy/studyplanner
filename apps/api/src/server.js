import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './middleware/errorHandler.js';
import { prisma } from './db/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDir = path.resolve(__dirname, '..');

const PORT = config.port;

async function bootstrap() {
  try {
    // 1. Verify if database tables are initialized
    await prisma.user.findFirst();
  } catch (err) {
    logger.info('Database schema not initialized. Auto-synchronizing tables via Prisma...');
    try {
      execSync('npx prisma db push --skip-generate', {
        cwd: apiDir,
        env: { ...process.env },
        stdio: 'ignore'
      });
      logger.info('Database tables synchronized successfully.');

      // 2. Auto-seed initial demo curriculum if database is empty
      const userCount = await prisma.user.count().catch(() => 0);
      if (userCount === 0) {
        logger.info('Fresh deployment detected. Auto-seeding scholar curriculum and demo accounts...');
        execSync('node src/seed.js', {
          cwd: apiDir,
          env: { ...process.env },
          stdio: 'ignore'
        });
        logger.info('Demo scholar curriculum seeded successfully.');
      }
    } catch (syncErr) {
      logger.warn(`Database auto-provisioning warning: ${syncErr.message}`);
    }
  }

  app.listen(PORT, () => {
    logger.info(`AI Smart Study Planner API Server running on port ${PORT}`);
    logger.info(`API Health: http://localhost:${PORT}/api/v1/health`);
    logger.info(`Cloud Health: http://localhost:${PORT}/healthz`);
  });
}

bootstrap();
