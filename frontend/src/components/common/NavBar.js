import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/NavBar.css';

const NavBar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleLogoClick = () => {
    navigate('/'); // Redirect to the dashboard
  };

  const mainContentStyle = {
    marginLeft: isDrawerOpen ? '250px' : '0',
    transition: 'margin-left 0.3s ease-in-out',
  };

  return (
    <div className="main-content" style={mainContentStyle}>
      <nav className="nav-bar">
        <div className="nav-left">
          <button className="hamburger-menu" onClick={toggleDrawer}>
            ☰
          </button>
          <div
            className="logo"
            onClick={handleLogoClick}
            style={{ cursor: 'pointer' }}
          >
            Smart Budget
          </div>
        </div>
        <div className={`drawer ${isDrawerOpen ? 'open' : ''}`}>
          <ul className="drawer-links">
            <li>
              <a href="/expense" onClick={toggleDrawer}>
                Expenses
              </a>
            </li>
            <li>
              <a href="/income" onClick={toggleDrawer}>
                Incomes
              </a>
            </li>
            <li>
              <a href="/savings" onClick={toggleDrawer}>
                Savings
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
