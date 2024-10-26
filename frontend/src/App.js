import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ExpensePage from './pages/ExpensePage';
import IncomePage from './pages/IncomePage';
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

        {/* Expense Page */}
        <Route path="/expense" element={<ExpensePage />} />

        {/* Income Page */}
        <Route path="/income" element={<IncomePage />} />

        {/* Savings Page */}
        <Route path="/savings" element={<SavingsPage />} />

        {/* Charts Page */}
        <Route path="/charts" element={<ChartsPage />} />
      </Routes>
    </div>
  );
}

export default App;
