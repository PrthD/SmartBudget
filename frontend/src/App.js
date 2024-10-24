import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ExpensesPage from './pages/ExpensesPage';
import IncomesPage from './pages/IncomesPage';
import SavingsPage from './pages/SavingsPage';
import ChartsPage from './pages/ChartsPage';
import Dashboard from './pages/Dashboard';
// import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Dashboard Page */}
        <Route path="/" element={<Dashboard />} />

        {/* Expenses Page */}
        <Route path="/expenses" element={<ExpensesPage />} />

        {/* Incomes Page */}
        <Route path="/incomes" element={<IncomesPage />} />

        {/* Savings Page */}
        <Route path="/savings" element={<SavingsPage />} />

        {/* Charts Page */}
        <Route path="/charts" element={<ChartsPage />} />
      </Routes>
    </div>
  );
}

export default App;
