const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const aiRoutes = require('./routes/aiRoutes');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);  // AI routes

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
