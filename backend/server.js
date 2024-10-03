import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import aiRoutes from './routes/aiRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware for CORS
app.use(cors({ origin: 'http://localhost:3000' }));
// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes); // AI routes
app.use('/api/expenses', expenseRoutes); // Expense routes
app.use('/api/income', incomeRoutes); // Income routes

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
