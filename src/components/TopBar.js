// src/components/TopBar.js
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './TopBar.css';

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine role based on current path
  let roleText = '';
  if (location.pathname.startsWith('/superadmin')) {
    roleText = 'System Admin';
  } else if (location.pathname.startsWith('/admin')) {
    roleText = 'Admin';
  } else if (location.pathname.startsWith('/blockhead')) {
    roleText = 'Block Head';
  }

  // Show "Home" only on the Login page
  const showHome = location.pathname === '/login';

  // Show "Logout" only if not on Welcome or Login page
  const showLogout = location.pathname !== '/' && location.pathname !== '/login';

 const handleLogout = () => {
  localStorage.removeItem('pen');
  localStorage.removeItem('password'); // Only if you stored it (not recommended)
  localStorage.removeItem('role');
  // Optionally clear everything (if needed)
  // localStorage.clear();

  navigate('/login');
};


  return (
    <div className="top-bar">
      <div className="left-section">
        <img src="/logo.png" alt="logo" className="logo" />
        <div className="title-block">
          <div className="title-section">RMS</div>
          <div className="subtitle-section">Kerala Police Academy</div>
        </div>
      </div>

      <div className="center-section">
        <div className="role-text">{roleText}</div>
      </div>

      <div className="right-section">
        {showHome && (
          <button className="home-button" onClick={() => navigate('/')}>
            Home
          </button>
        )}
        {showLogout && (
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default TopBar;
