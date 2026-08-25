import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';

import { corsOptions } from './config/cors';
import { errorHandler } from './common/middleware/errorHandler.middleware';

import authRouter from './modules/auth/auth.router';
import usersRouter from './modules/users/users.router';
import lessonsRouter from './modules/lessons/lessons.router';
import testsRouter from './modules/tests/tests.router';
import paymentsRouter from './modules/payments/payments.router';
import libraryRouter from './modules/library/library.router';
import dictionaryRouter from './modules/dictionary/dictionary.router';
import gamificationRouter from './modules/gamification/gamification.router';
import adminRouter from './modules/admin/admin.router';

const app = express();

// ── Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving uploads cross-origin
}));

// ── CORS
app.use(cors(corsOptions));

// ── Request logging
app.use(morgan('dev'));

// ── Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate limiting (only active in production)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests. Please slow down.' } },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many auth attempts.' } },
  });

  app.use('/api/', limiter);
  app.use('/api/v1/auth', authLimiter);
}

// ── Static files (uploaded receipts/submissions)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1', usersRouter);
app.use('/api/v1/lessons', lessonsRouter);
app.use('/api/v1/tests', testsRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/library', libraryRouter);
app.use('/api/v1/dictionary', dictionaryRouter);
app.use('/api/v1/gamification', gamificationRouter);
app.use('/api/v1/admin', adminRouter);

// ── Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

// ── Global error handler (MUST be last)
app.use(errorHandler);

export default app;
