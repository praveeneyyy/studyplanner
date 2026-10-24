import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import plannerRoutes from './routes/plannerRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import revisionRoutes from './routes/revisionRoutes.js';
import rewardRoutes from './routes/rewardRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import preferenceRoutes from './routes/preferenceRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import executionRoutes from './routes/executionRoutes.js';

export const app = express();

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false // Allow local dev Vite and SSE
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without origin (same-origin, mobile apps, Postman)
      if (!origin) return callback(null, true);
      
      // Local development origins
      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }
      
      // Configured production client origin(s)
      if (config.clientOrigin) {
        const allowed = config.clientOrigin.split(',').map((s) => s.trim());
        if (allowed.includes(origin) || allowed.includes('*')) {
          return callback(null, true);
        }
      }

      return callback(null, true);
    },
    credentials: true
  })
);

// Rate limiter: 300 requests per 15 minutes for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'AI Smart Study Planner',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/execution', executionRoutes);
app.use('/api/v1', subjectRoutes);
app.use('/api/v1', plannerRoutes);
app.use('/api/v1', aiRoutes);
// Direct alias for standard /api/ai endpoints
app.use('/api', aiRoutes);
app.use('/api/v1', quizRoutes);
app.use('/api/v1', revisionRoutes);
app.use('/api/v1', rewardRoutes);
app.use('/api/v1', analyticsRoutes);
app.use('/api/v1', preferenceRoutes);
app.use('/api/v1', noteRoutes);

// Serve Web Frontend build in production environments if available
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDistPath = path.resolve(__dirname, '../../web/dist');

if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);
