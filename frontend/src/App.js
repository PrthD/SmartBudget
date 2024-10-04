import React from 'react';
import ExpenseForm from './components/ExpenseForm.js';
import IncomeForm from './components/IncomeForm.js';
import AIRecommendationForm from './components/AIRecommendationForm.js';
import Dashboard from './pages/Dashboard.js';

function App() {
  return (
    <div className="App">
      {/* Header Section */}
      <header>
        <h1>SmartBudgetAI Dashboard</h1>
      </header>

      {/* Expense Section */}
      <section className="expense-section">
        <h2>Expense Tracker</h2>
        <ExpenseForm />
      </section>

      {/* Income Section */}
      <section className="income-section">
        <h2>Income Tracker</h2>
        <IncomeForm />
      </section>

      {/* AI Recommendations Section */}
      <section className="recommendation-section">
        <h2>AI Budget Recommendations</h2>
        <AIRecommendationForm />
      </section>

      {/* Dashboard Section */}
      <section className="dashboard-section">
        <h2>Dashboard</h2>
        <Dashboard />
      </section>
    </div>
  );
}

export default App;
