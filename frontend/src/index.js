import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import { notifyError } from './utils/notificationService';
import App from './App';
import './index.css';

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  notifyError(
    'An unexpected error occurred. Please check your network or try again.'
  );
});

window.addEventListener('error', (event) => {
  console.error('Global JS error:', event.error);
  notifyError(
    'An unexpected error occurred in the application. Please try again.'
  );
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
