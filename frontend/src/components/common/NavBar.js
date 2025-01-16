import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import { logoutUser } from '../../services/userService';
import '../../styles/common/NavBar.css';

const NavBar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const mainContentStyle = {
    marginLeft: isDrawerOpen ? '250px' : '0',
    transition: 'margin-left 0.3s ease-in-out',
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
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
            SMART BUDGET
          </div>
        </div>
        <div className="nav-right">
          {/* <FaBell className="notification-icon" /> */}
          <div
            className="profile-icon-wrapper"
            onClick={toggleProfileDropdown}
            ref={dropdownRef}
          >
            <FaUserCircle className="profile-icon" />
            {isProfileDropdownOpen && (
              <div className="profile-dropdown">
                <button>Profile</button>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
        <div className={`drawer ${isDrawerOpen ? 'open' : ''}`}>
          <div className="drawer-profile">
            <div className="profile-placeholder">User</div>
            <p className="profile-name">John Doe</p>
          </div>
          <ul className="drawer-links">
            <li>
              <a href="/" onClick={closeDrawer}>
                Dashboard
              </a>
            </li>
            <li>
              <a href="/expense" onClick={closeDrawer}>
                Expenses
              </a>
            </li>
            <li>
              <a href="/income" onClick={closeDrawer}>
                Incomes
              </a>
            </li>
            <li>
              <a href="/savings" onClick={closeDrawer}>
                Savings
              </a>
            </li>
          </ul>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        {isDrawerOpen && (
          <div className="drawer-overlay" onClick={closeDrawer} />
        )}
      </nav>
    </div>
  );
};

export default NavBar;
