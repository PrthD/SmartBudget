import React, { useState, useEffect } from 'react';
import ExpenseForm from './components/ExpenseForm.js';
import IncomeForm from './components/IncomeForm.js';
import AIRecommendationForm from './components/AIRecommendationForm.js';
import Dashboard from './pages/Dashboard.js';
import axios from 'axios';

function App() {
  // Global state for income, expenses, and savings data
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);

  // Fetch income and expenses on component mount
  useEffect(() => {
    fetchIncomeData();
    fetchExpenseData();
  }, []);

  // Function to fetch income data
  const fetchIncomeData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/income');
      setIncomeData(response.data);
    } catch (error) {
      console.error('Error fetching income data:', error);
    }
  };

  // Function to fetch expense data
  const fetchExpenseData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/expenses');
      setExpenseData(response.data);
    } catch (error) {
      console.error('Error fetching expense data:', error);
    }
  };

  return (
    <div className="App">
      {/* Header Section */}
      <header>
        <h1>SmartBudgetAI Dashboard</h1>
      </header>

      {/* Expense Section */}
      <section className="expense-section">
        <h2>Expense Tracker</h2>
        <ExpenseForm onExpenseAdded={fetchExpenseData} />
      </section>

      {/* Income Section */}
      <section className="income-section">
        <h2>Income Tracker</h2>
        <IncomeForm onIncomeAdded={fetchIncomeData} />
      </section>

      {/* AI Recommendations Section */}
      <section className="recommendation-section">
        <h2>AI Budget Recommendations</h2>
        <AIRecommendationForm />
      </section>

      {/* Dashboard Section */}
      <section className="dashboard-section">
        <h2>Dashboard</h2>
        <Dashboard incomeData={incomeData} expenseData={expenseData} />
      </section>
    </div>
  );
}

export default App;
