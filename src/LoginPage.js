import React, { useState } from 'react';
import './LoginPage.css';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    const response = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (data.success) {
      if (data.role === 'admin') navigate('/admin');
      else if (data.role === 'superadmin') navigate('/superadmin');
      else if (data.role === 'blockhead') navigate('/blockhead');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="login-container">
      <div className="header">
        <img src="/logo.png" alt="Logo" />
        <h2>RAMS<br /><small>Kerala Police Academy</small></h2>
      </div>

      <h3>LOGIN</h3>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="input-field"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="input-field"
      />

      <div className="button-group">
        <button className="back-btn" onClick={() => navigate('/')}>BACK</button>
        <button className="sign-btn" onClick={handleLogin}>SIGN IN</button>
      </div>
    </div>
  );
}

export default LoginPage;
