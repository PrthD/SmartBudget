import React from 'react';
import ExpenseForm from './components/ExpenseForm.js';
import IncomeForm from './components/IncomeForm.js';
import AIRecommendationForm from './components/AIRecommendationForm.js'; // Import the new AIRecommendationForm component

function App() {
  return (
    <div className="App">
      <h1>SmartBudgetAI Expense Tracker</h1>
      <ExpenseForm />
      <h1>SmartBudgetAI Income Tracker</h1>
      <IncomeForm />
      <h1>AI Budget Recommendations</h1>{' '}
      {/* Add a new section for AI recommendations */}
      <AIRecommendationForm />
    </div>
  );
}

export default App;
