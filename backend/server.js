import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import logger from './config/logger.js';
import connectDB from './config/db.js';
import aiRoutes from './routes/aiRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';

dotenv.config();

const app = express();

connectDB();

// Middleware for CORS
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Middleware to log all HTTP requests using morgan and winston
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Routes
app.use('/api/ai', aiRoutes); // AI routes
app.use('/api/expenses', expenseRoutes); // Expense routes
app.use('/api/income', incomeRoutes); // Income routes

// Global error-handling middleware
app.use((err, res) => {
  logger.error(err.message);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Process terminated');
  });
});
