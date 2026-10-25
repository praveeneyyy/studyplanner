import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../src/db/prisma.js';
import bcrypt from 'bcrypt';
import { beforeAll } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure essential test environment variables
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'super_secret_ai_smart_study_planner_jwt_key_2026_xyz';
process.env.NODE_ENV = 'test';

// Synchronize database schema before running integration test suites
try {
  execSync('npx prisma db push --skip-generate', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: 'ignore'
  });
} catch (e) {
  // If running in restricted or mock environment, continue
}

beforeAll(async () => {
  try {
    const scholars = [
      { email: 'swetha@university.edu', name: 'Swetha', level: 'Undergraduate' },
      { email: 'prathima@university.edu', name: 'Prathima', level: 'Undergraduate' }
    ];

    for (const s of scholars) {
      const existing = await prisma.user.findFirst({
        where: { OR: [{ email: s.email }, { fullName: s.name }] }
      });
      if (!existing) {
        await prisma.user.create({
          data: {
            email: s.email,
            fullName: s.name,
            passwordHash: await bcrypt.hash('Scholar2026!', 10),
            academicLevel: s.level,
            institution: 'Institute of Technology',
            preferences: { create: {} },
            notificationPref: { create: {} }
          }
        });
      }
    }
  } catch (err) {
    // Graceful fallback if database schema is being created per-test
  }
});
