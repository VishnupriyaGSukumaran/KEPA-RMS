// src/AllocationForm.js
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AllocationForm.css';

const AllocationForm = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const purpose = state?.purpose || 'N/A';

  const handleCancel = () => navigate('/');
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Room allocated successfully!");
  };

  return (
    <form className="allocation-form" onSubmit={handleSubmit}>
      <h3>Details</h3>
      <p><strong>Purpose:</strong> {purpose}</p>

      <div className="form-row">
        <label>Name*</label>
        <input type="text" required />
        <label>Recruitment No/PEN*</label>
        <input type="text" required />
      </div>

      <div className="form-row">
        <label>Mobile no*</label>
        <input type="tel" required />
        <label>Emergency no*</label>
        <input type="tel" required />
      </div>

      <div className="form-row full-width">
        <label>Address*</label>
        <input type="text" required />
      </div>

      <div className="form-row">
        <label>Bed no*</label>
        <input type="text" required />
      </div>

      <div className="form-buttons">
        <button type="button" className="view-btn">View Block</button>
        <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
        <button type="submit" className="submit-btn">Submit</button>
      </div>
    </form>
  );
};

export default AllocationForm;
