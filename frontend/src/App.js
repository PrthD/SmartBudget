import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ExpensePage from './pages/ExpensePage';
import IncomePage from './pages/IncomePage';
import SavingsPage from './pages/SavingsPage';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import { LoadingProvider } from './contexts/LoadingContext';
import GlobalLoader from './components/common/GlobalLoader';
import ProtectedRoute from './components/common/ProtectedRoute';
// import './App.css';

function App() {
  return (
    <LoadingProvider>
      <ToastContainer />
      <GlobalLoader />
      <div className="App">
        <Routes>
          {/* Dashboard Page */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Profile Page */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Expense Page */}
          <Route
            path="/expense"
            element={
              <ProtectedRoute>
                <ExpensePage />
              </ProtectedRoute>
            }
          />

          {/* Income Page */}
          <Route
            path="/income"
            element={
              <ProtectedRoute>
                <IncomePage />
              </ProtectedRoute>
            }
          />

          {/* Savings Page */}
          <Route
            path="/savings"
            element={
              <ProtectedRoute>
                <SavingsPage />
              </ProtectedRoute>
            }
          />

          {/* Auth Routes */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
        </Routes>
      </div>
    </LoadingProvider>
  );
}

export default App;
