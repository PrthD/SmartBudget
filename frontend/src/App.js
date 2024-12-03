import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ExpensePage from './pages/ExpensePage';
import IncomePage from './pages/IncomePage';
import SavingsPage from './pages/SavingsPage';
import ChartsPage from './pages/ChartsPage';
import Dashboard from './pages/Dashboard';
import { LoadingProvider } from './contexts/LoadingContext';
import GlobalLoader from './components/common/GlobalLoader';
// import './App.css';

function App() {
  return (
    <LoadingProvider>
      <ToastContainer />
      <GlobalLoader />
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
    </LoadingProvider>
  );
}

export default App;
