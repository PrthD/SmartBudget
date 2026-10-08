import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { requireAuth } from './middleware/auth.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { withUserContext } from './modules/users/context.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { createTransactionRouter } from './modules/transactions/transactions.routes.js';
import { TRANSACTION_KINDS } from './modules/transactions/transactions.config.js';
import {
  budgetRouter,
  incomeGoalRouter,
} from './modules/targets/targets.routes.js';
import {
  savingsGoalsRouter,
  savingsPlanRouter,
} from './modules/savings/savings.routes.js';
import { analyticsRouter } from './modules/analytics/analytics.routes.js';
import { aiRouter } from './modules/ai/ai.routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/health' },
    })
  );
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true, // the refresh-token cookie
      maxAge: 600,
    })
  );
  app.use(compression());
  app.use(cookieParser());

  // Larger bodies only where images are uploaded; 100 KB everywhere else.
  app.use('/api/v1/users/me/avatar', express.json({ limit: '1mb' }));
  app.use('/api/v1/ai/parse', express.json({ limit: '6mb' }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res
      .status(dbReady ? 200 : 503)
      .json({ status: dbReady ? 'ok' : 'degraded' });
  });

  const api = express.Router();
  api.use(apiLimiter);
  api.use('/auth', authRouter);

  // Everything below requires a signed-in user.
  api.use(requireAuth);
  api.use('/users', usersRouter);
  api.use(withUserContext);
  api.use('/expenses', createTransactionRouter(TRANSACTION_KINDS.expense));
  api.use('/incomes', createTransactionRouter(TRANSACTION_KINDS.income));
  api.use('/budget', budgetRouter);
  api.use('/income-goal', incomeGoalRouter);
  api.use('/savings-goals', savingsGoalsRouter);
  api.use('/savings-plan', savingsPlanRouter);
  api.use('/analytics', analyticsRouter);
  api.use('/ai', aiRouter);

  app.use('/api/v1', api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
