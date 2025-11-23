import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const Login = () => {
  const [pen, setPen] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-page">
      {/* Left Side - Branding */}
      <div className="login-left">
        <div className="brand-content">
          <div className="logo-circle">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="white" strokeWidth="3"/>
              <path d="M30 40 L37 47 L50 33" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="brand-title">Secure Portal</h1>
          <p className="brand-subtitle">Access your dashboard with confidence</p>
          
          <div className="features">
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="feature-text">
                <h3>Multi-Role Access</h3>
                <p>Admin, SuperAdmin & BlockHead portals</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="white" strokeWidth="2"/>
                  <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="white" strokeWidth="2"/>
                </svg>
              </div>
              <div className="feature-text">
                <h3>Secure Authentication</h3>
                <p>Protected with industry standards</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="feature-text">
                <h3>Fast & Reliable</h3>
                <p>Quick access to your workspace</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="form-header">
            <h2 className="form-title">Welcome Back</h2>
            <p className="form-subtitle">Please enter your credentials to continue</p>
          </div>

          <div className="form-content">
            <div className="form-group">
              <label className="form-label">Personal Employment Number</label>
              <div className="input-container">
                <div className="input-icon-left">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="7" r="4" stroke="#000080" strokeWidth="1.5"/>
                    <path d="M3 18C3 14.134 6.134 11 10 11C13.866 11 17 14.134 17 18" stroke="#000080" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={pen}
                  onChange={(e) => setPen(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your PEN"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-container">
                <div className="input-icon-left">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="4" y="9" width="12" height="9" rx="2" stroke="#000080" strokeWidth="1.5"/>
                    <path d="M7 9V6C7 4.34315 8.34315 3 10 3C11.6569 3 13 4.34315 13 6V9" stroke="#000080" strokeWidth="1.5"/>
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  className="form-input"
                />
                <button 
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M2 2L18 18" stroke="#000080" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M9.58 5.58C9.72 5.53 9.86 5.5 10 5.5C11.38 5.5 12.5 6.62 12.5 8C12.5 8.14 12.47 8.28 12.42 8.42" stroke="#000080" strokeWidth="1.5"/>
                      <path d="M5 10C5 10 7 6 10 6M15 10C15 10 13 14 10 14" stroke="#000080" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 5C6 5 3 10 3 10C3 10 6 15 10 15C14 15 17 10 17 10C17 10 14 5 10 5Z" stroke="#000080" strokeWidth="1.5"/>
                      <circle cx="10" cy="10" r="2" stroke="#000080" strokeWidth="1.5"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="btn-secondary"
                onClick={() => navigate('/')}
                disabled={isLoading}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              
              <button 
                className="btn-primary"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M7 4L12 9L7 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="form-footer">
            <div className="footer-line"></div>
            <p className="footer-text">Secured by Advanced Encryption</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;