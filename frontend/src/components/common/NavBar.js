import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import {
  fetchUserDetails,
  generateDefaultAvatar,
  logoutUser,
} from '../../services/userService';
import smartBudgetIcon from '../../assets/icons/smartbudget-icon.png';
import '../../styles/common/NavBar.css';

const NavBar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const userDetails = await fetchUserDetails();
        setUser(userDetails);
      } catch (err) {
        console.error('Error fetching user in NavBar:', err);
      }
    };
    getUserData();
  }, []);

  useEffect(() => {
    const handleUserUpdated = (event) => {
      if (event.detail) {
        setUser(event.detail);
      }
    };
    window.addEventListener('user-updated', handleUserUpdated);
    return () => {
      window.removeEventListener('user-updated', handleUserUpdated);
    };
  }, []);

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

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  let userPhoto = '';
  if (user) {
    if (user.profilePhoto) {
      userPhoto = user.profilePhoto;
    } else {
      userPhoto = generateDefaultAvatar(user.name);
    }
  }

  return (
    <div className="main-content">
      <nav className="nav-bar">
        <div className="nav-left">
          <button className="hamburger-menu" onClick={toggleDrawer}>
            ☰
          </button>
          <div className="logo" onClick={handleLogoClick}>
            <img
              src={smartBudgetIcon}
              alt="Smart Budget Icon"
              className="nav-logo-icon"
            />
            <span>SMART BUDGET</span>
          </div>
        </div>

        {/* Profile Icon + Name */}
        <div className="nav-right">
          {/* <FaBell className="notification-icon" /> */}
          <div
            className="profile-icon-wrapper"
            onClick={toggleProfileDropdown}
            ref={dropdownRef}
          >
            {user && userPhoto ? (
              <img src={userPhoto} alt="profile" className="nav-profile-img" />
            ) : (
              <FaUserCircle className="profile-icon" />
            )}

            {isProfileDropdownOpen ? (
              <FaChevronUp className="nav-chevron-icon" />
            ) : (
              <FaChevronDown className="nav-chevron-icon" />
            )}

            {isProfileDropdownOpen && (
              <div className="profile-dropdown">
                <button onClick={handleProfileClick}>Profile</button>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>

        <div className={`drawer ${isDrawerOpen ? 'open' : ''}`}>
          {/* Drawer Profile */}
          <div className="drawer-profile" onClick={handleProfileClick}>
            {user && userPhoto ? (
              <img
                src={userPhoto}
                alt="profile"
                className="drawer-profile-img"
              />
            ) : (
              <div className="profile-placeholder">User</div>
            )}
            <p className="profile-name">{user ? user.name : 'John Doe'}</p>
          </div>

          {/* Drawer Links */}
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
