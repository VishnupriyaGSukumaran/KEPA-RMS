import React from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomePage.css';

function WelcomePage() {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="welcome-container">
      {/* Top Blue Bar */}
       <div className="top-bar">
  <div className="logo-title">
    <img src="/logo.png" alt="logo" className="logo" />
    <div className="title-block">
      <div className="title-section">RMS</div>
      <div className="subtitle-section">Kerala Police Academy </div>
    </div>
  </div>
</div>


      {/* Main Section */}
      <div className="main-section">
        <h1 className="main-heading">
          ROOM MANAGEMENT SYSTEM
        </h1>

        <button className="login-button" onClick={handleLoginClick}>
          Login
        </button>
      </div>
    </div>
  );
}

export default WelcomePage;
