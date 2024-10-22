import React, { useState, useEffect } from 'react';
import ExpenseForm from './components/expenses/ExpenseForm.js';
import IncomeForm from './components/incomes/IncomeForm.js';
import AIRecommendationForm from './components/AI-Integrations/AIRecommendationForm.js';
import Dashboard from './pages/Dashboard.js';
import axios from 'axios';

function App() {
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [incomeResponse, expenseResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/income'),
        axios.get('http://localhost:5000/api/expenses'),
      ]);
      setIncomeData(incomeResponse.data);
      setExpenseData(expenseResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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
        <ExpenseForm onExpenseAdded={fetchData} />
      </section>

      {/* Income Section */}
      <section className="income-section">
        <h2>Income Tracker</h2>
        <IncomeForm onIncomeAdded={fetchData} />
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
