const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const aiRoutes = require('./routes/aiRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
