// ... same imports ...
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaSignOutAlt } from 'react-icons/fa';
import './VacateRoom.css'; // if you're using the CSS I gave earlier

const VacateRoom = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    pen: '',
    vacateDate: '',
    paid: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = () => {
    if (formData.paid === 'Yes') {
      navigate('/payment-receipt');
    } else if (formData.paid === 'No') {
      navigate('/final-vacate');
    }
  };

  return (
    <div className="vacate-page">
      {/* Navbar */}
      <header className="vacate-navbar">
        <div className="nav-left">
          <img src="/logo.png" alt="Kerala Police" className="logo" />
          <div>
            <h3>RMS</h3>
            <p>Kerala Police</p>
          </div>
        </div>
        <div className="nav-right">
          <a href="#"><FaHome /> Home</a>
          <a href="#"><FaSignOutAlt /> Logout</a>
        </div>
      </header>

      {/* Main Form */}
      <div className="vacate-container">
        <h2>Vacate Personnel</h2>
        <div className="vacate-form">
          <div className="form-row">
            <label>Name*</label>
            <input name="name" type="text" value={formData.name} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Recruitment No/PEN*</label>
            <input name="pen" type="text" value={formData.pen} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Vacating Date*</label>
            <input name="vacateDate" type="date" value={formData.vacateDate} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label>Paid*</label>
            <select name="paid" value={formData.paid} onChange={handleChange}>
              <option value="">--Select--</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div className="button-group">
            <button className="blue-btn">View Details</button>
            <button className="cancel-btn">Cancel</button>
            <button className="red-btn" onClick={handleSubmit}>Confirm Vacate</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VacateRoom;