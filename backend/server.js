import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import logger from './config/logger.js';
import { connectDB, disconnectDB } from './config/db.js';
import expenseRoutes from './routes/expenseRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import incomeGoalRoutes from './routes/incomeGoalRoutes.js';
import savingsRoutes from './routes/savingsRoutes.js';
import savingsGoalRoutes from './routes/savingsGoalRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_DEV_ORIGIN,
  process.env.FRONTEND_PROD_ORIGIN,
  process.env.FRONTEND_CUSTOM_ORIGIN,
];

// Connect to Database
connectDB();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins.filter(Boolean),
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging HTTP requests with morgan and winston
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Routes
app.use('/api/expense', expenseRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/income-goal', incomeGoalRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/savings-goal', savingsGoalRoutes);
app.use('/api/users', userRoutes);

// Centralized error-handling middleware
app.use((err, req, res, _next) => {
  const statusCode = err.status || 500;
  logger.error(
    `${req.method} ${req.originalUrl} ${statusCode} - ${err.message}`
  );
  res
    .status(statusCode)
    .json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  server.close(async () => {
    logger.info('Process terminated');
    console.log('Process terminated');
    await disconnectDB();
    process.exit(0);
  });
});
