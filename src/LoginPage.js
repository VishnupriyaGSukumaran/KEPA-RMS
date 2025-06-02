import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const Login = () => {
  const [pen, setPen] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // Handle login API call here
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <img src="/logo.png" alt="Kerala Police Logo" className="logo" />
        <div className="title-group">
        <div>
          <div className="title-section">RMS</div>
          <div className="subtitle-section">Kerala Police Academy</div>
        </div>
        </div>
           <button className="home-button" onClick={() => navigate(-1)} >Home</button>
      
      </header>

      <h2 className="login-title">LOGIN</h2>

      <div className="login-form">
        <input
          type="text"
          placeholder="pen"
          value={pen}
          onChange={(e) => setPen(e.target.value)}
          className="input-box"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-box"
        />

        

        <div className="button-group">
          <button onClick={() => navigate(-1)} className="back-button">BACK</button>
          <button onClick={handleLogin} className="signin-button">SIGN IN</button>
        
        </div>
      </div>
    </div>
  );
};

export default Login;
