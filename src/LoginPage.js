// Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const Login = () => {
  const [pen, setPen] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pen, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('pen', data.pen);
        localStorage.setItem('role', data.role);

        const role = data.role?.toLowerCase();

        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'superadmin') {
          navigate('/superadmin/dashboard');
        } else if (role === 'blockhead') {
          if (data.assignedBlock) {
            localStorage.setItem('assignedBlock', data.assignedBlock);
            // Navigate immediately
            navigate(`/blockhead/dashboard/${data.assignedBlock}`);
          } else {
            alert('No block assigned to this Block Head.');
          }
        } else {
          alert('Unknown user role: ' + role);
        }
      } else {
        alert(data.msg || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Server error. Please try again later.');
    }
  };

  return (
    <div className="create-user-container">
      <h2 className="login-title">LOGIN</h2>

      <div className="login-form">
        <input
          type="text"
          placeholder="PEN"
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
          <button onClick={() => navigate('/')} className="back-button">BACK</button>
          <button onClick={handleLogin} className="signin-button">SIGN IN</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
