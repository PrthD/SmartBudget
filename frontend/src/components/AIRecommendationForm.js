import React, { useState } from 'react';
import axios from 'axios';
import '../styles/AIRecommendationForm.css'; // Create and style this CSS file as needed

const AIRecommendationForm = () => {
  // State management for form fields
  const [totalExpenses, setTotalExpenses] = useState('');
  const [totalIncome, setTotalIncome] = useState('');
  const [savings, setSavings] = useState('');
  const [questionIndex, setQuestionIndex] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Predefined questions to display in the dropdown
  const predefinedQuestions = [
    'How should I allocate my budget?',
    'What savings goals should I set?',
    'How can I cut unnecessary expenses?',
  ];

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    if (!totalExpenses || !totalIncome || !savings || questionIndex === '') {
      setError('Please fill in all fields and select a question.');
      setRecommendation('');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setRecommendation('');

      // Send request to the backend API
      const response = await axios.post(
        'http://localhost:5000/api/ai/recommendation',
        {
          questionIndex: parseInt(questionIndex),
          totalExpenses: parseFloat(totalExpenses),
          totalIncome: parseFloat(totalIncome),
          savings: parseFloat(savings),
        }
      );

      // Display the AI-generated recommendation
      setRecommendation(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch AI recommendation. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="ai-recommendation-form">
      <h2>Get AI Budget Recommendations</h2>
      <form onSubmit={handleSubmit}>
        {/* Total Expenses Input */}
        <div className="form-group">
          <label htmlFor="totalExpenses">Total Monthly Expenses ($):</label>
          <input
            type="number"
            id="totalExpenses"
            value={totalExpenses}
            onChange={(e) => setTotalExpenses(e.target.value)}
            required
            min="0"
            step="0.01"
            placeholder="Enter your total monthly expenses"
          />
        </div>

        {/* Total Income Input */}
        <div className="form-group">
          <label htmlFor="totalIncome">Total Monthly Income ($):</label>
          <input
            type="number"
            id="totalIncome"
            value={totalIncome}
            onChange={(e) => setTotalIncome(e.target.value)}
            required
            min="0"
            step="0.01"
            placeholder="Enter your total monthly income"
          />
        </div>

        {/* Savings Input */}
        <div className="form-group">
          <label htmlFor="savings">Current Savings ($):</label>
          <input
            type="number"
            id="savings"
            value={savings}
            onChange={(e) => setSavings(e.target.value)}
            required
            min="0"
            step="0.01"
            placeholder="Enter your current savings"
          />
        </div>

        {/* Question Dropdown */}
        <div className="form-group">
          <label htmlFor="question">Select a Question:</label>
          <select
            id="question"
            value={questionIndex}
            onChange={(e) => setQuestionIndex(e.target.value)}
            required
          >
            <option value="">Select a question</option>
            {predefinedQuestions.map((question, index) => (
              <option key={index} value={index}>
                {question}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Get Recommendation'}
        </button>
      </form>

      {/* Error Message */}
      {error && <p className="error-message">{error}</p>}

      {/* Display Recommendation */}
      {recommendation && (
        <div className="recommendation-result">
          <h3>AI Budget Recommendation:</h3>
          <p>{recommendation}</p>
        </div>
      )}
    </div>
  );
};

export default AIRecommendationForm;
