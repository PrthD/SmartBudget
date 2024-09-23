const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Initialize express app
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Connect to MongoDB (remove deprecated options)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI); // No options needed
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Call the connectDB function to connect to MongoDB
connectDB();

// Import Hugging Face routes
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes); // Mount the Hugging Face API routes

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
