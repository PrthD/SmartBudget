import React from 'react';
import PropTypes from 'prop-types';
import { notifyError } from '../../utils/notificationService';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    notifyError('An unexpected error occurred. Please try again.');
    console.error('Error Boundary Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f9f9f9',
          }}
        >
          <div
            style={{
              background: '#fff',
              maxWidth: '500px',
              width: '90%',
              margin: '2rem auto',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                marginBottom: '1rem',
                fontSize: '1.8rem',
                color: '#333',
              }}
            >
              Oops, something went wrong
            </h2>
            <p
              style={{
                fontSize: '1rem',
                color: '#777',
                marginBottom: '1.5rem',
              }}
            >
              Please refresh the page or come back later.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#4a90e2',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
