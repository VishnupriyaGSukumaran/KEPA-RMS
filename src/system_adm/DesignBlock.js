import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateUser.css';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    userType: '',
    firstName: '',
    lastName: '',
    pen: '',
    phoneNumber: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    assignedBlock: '',
  });

  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [accountCreated, setAccountCreated] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (formData.userType === 'blockhead') {
      fetch('http://localhost:5000/api/block')
        .then((res) => res.json())
        .then((data) => setAvailableBlocks(data))
        .catch((err) => console.error('Error fetching blocks:', err));
    } else {
      setAvailableBlocks([]);
    }
  }, [formData.userType]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCancel = () => {
    setFormData({
      userType: '',
      firstName: '',
      lastName: '',
      pen: '',
      phoneNumber: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      assignedBlock: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    const res = await fetch('http://localhost:5000/api/createauth/superadmin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (res.ok) {
      setAccountCreated(true);
      setTimeout(() => {
        setAccountCreated(false);
        handleCancel();
      }, 2000);
    } else {
      setErrorMsg(data.message || 'Failed to create user');
    }
  };

  return (
    <>
      <div className="top-header">
        <div className="logo-title">
          <img src="/logo.png" alt="Kerala Police" className="logo" />
          <div>
            <div className="rams">RAMS</div>
            <div className="subheading">Kerala Police</div>
          </div>
        </div>
        <div className="top-center">System Admin</div>
        <div className="top-right">
          <button onClick={() => navigate('/')}>Home</button>
          <button onClick={() => navigate('/login')}>Logout</button>
        </div>
      </div>

      <div className="create-user-container">
        <h2 className="form-heading">USER INFORMATION</h2>

        <form className="form-grid" onSubmit={handleSubmit}>
          {errorMsg && <div className="error-message">{errorMsg}</div>}

          <div className="form-group full-width">
            <select
              name="userType"
              className="full-width-select"
              value={formData.userType}
              onChange={handleChange}
              required
            >
              <option value="">-----Select User Type-----</option>
              <option value="admin">Admin</option>
              <option value="blockhead">Block Head</option>
            </select>
          </div>

          {formData.userType === 'blockhead' && (
            <div className="form-group full-width">
              <select
                name="assignedBlock"
                className="full-width-select"
                value={formData.assignedBlock}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Block --</option>
                {availableBlocks.map((block) => (
                  <option key={block._id} value={block.blockName}>
                    {block.blockName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} />
          <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} />
          <input name="pen" placeholder="PEN" value={formData.pen} onChange={handleChange} />
          <input name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} />
          <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
          <input name="username" placeholder="Username" value={formData.username} onChange={handleChange} />
          <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} />
          <input name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} />

          <div className="button-row">
            <button type="button" className="form-button" onClick={() => navigate('/superadmin/dashboard')}>← Back</button>
            <div className="button-right">
              <button type="button" className="form-button" onClick={handleCancel}>Cancel</button>
              <button
                type="submit"
                className="form-button"
                disabled={
                  !formData.userType ||
                  (formData.userType === 'blockhead' && !formData.assignedBlock) ||
                  formData.password !== formData.confirmPassword
                }
              >
                Create Account
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateUser;
