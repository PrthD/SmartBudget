import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser } from '../services/userService';
import { notifyError, notifySuccess } from '../utils/notificationService';
import smartBudgetIcon from '../assets/icons/smartbudget-icon.png';
import '../styles/auth/AuthPage.css';

const AuthPage = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [transition, setTransition] = useState(false);
  const [showDelayMessage, setShowDelayMessage] = useState(false);

  const switchMode = () => {
    setTransition(true);
    setTimeout(() => {
      setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
      setTransition(false);
    }, 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const delayTimer = setTimeout(() => {
      setShowDelayMessage(true);
    }, 3000);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          throw new Error('Name is required for signup.');
        }
        const res = await registerUser(name.trim(), email.trim(), password);
        clearTimeout(delayTimer);
        setShowDelayMessage(false);
        notifySuccess(
          `Welcome, ${res.user.name}! Your account has been created.`
        );
        navigate('/');
      } else {
        const res = await loginUser(email.trim(), password);
        clearTimeout(delayTimer);
        setShowDelayMessage(false);
        notifySuccess(`Welcome back, ${res.user.name}!`);
        navigate('/');
      }
    } catch (error) {
      clearTimeout(delayTimer);
      setShowDelayMessage(false);
      notifyError(error.message || 'Authentication error');
    }
  };

  return (
    <div className="auth-page-container">
      {/* Background with icon */}
      <div className="auth-page-background">
        <div className="auth-logo">SmartBudget</div>
        <img
          src={smartBudgetIcon}
          alt="Smart Budget icon"
          className="auth-icon"
        />
      </div>

      {/* Form container */}
      <div
        key={mode}
        className={`auth-form-wrapper ${transition ? 'form-transition' : ''}`}
      >
        <h2>{mode === 'login' ? 'Login' : 'Sign Up'}</h2>

        {showDelayMessage && (
          <div className="delay-notification">
            <p>Our server is waking up – please wait a moment...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="nameInput">Name</label>
              <input
                id="nameInput"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="emailInput">Email</label>
            <input
              id="emailInput"
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="passwordInput">Password</label>
            <input
              id="passwordInput"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="auth-submit-btn">
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p className="toggle-mode-text">
          {mode === 'login'
            ? "Don't have an account?"
            : 'Already have an account?'}
          <button
            type="button"
            onClick={switchMode}
            className="switch-mode-btn"
          >
            {mode === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
