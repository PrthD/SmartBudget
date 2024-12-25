import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import logger from './config/logger.js';
import { connectDB, disconnectDB } from './config/db.js';
import aiRoutes from './routes/aiRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import savingsRoutes from './routes/savingsRoutes.js';

dotenv.config();

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Logging HTTP requests with morgan and winston
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Routes
app.use('/api/ai', aiRoutes); // AI routes
app.use('/api/expense', expenseRoutes); // Expense routes
app.use('/api/budget', budgetRoutes); // Budget routes
app.use('/api/income', incomeRoutes); // Income routes
app.use('/api/savings', savingsRoutes); // Savings routes

// Centralized error-handling middleware
app.use((err, req, res) => {
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
