import mongoose from 'mongoose';

// Define the Income schema
const IncomeSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    trim: true, // Trim whitespaces
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be a positive number'], // Ensure the amount is positive
  },
  date: {
    type: Date,
    default: Date.now, // Default to the current date if not provided
  },
  description: {
    type: String,
    trim: true, // Optional description for the income source
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the user who created the income stream (optional)
  },
});

const Income = mongoose.models.Income || mongoose.model('Income', IncomeSchema);
export default Income;
