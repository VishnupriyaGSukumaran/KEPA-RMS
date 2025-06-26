import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AllocateForm.css';

const AllocateForm = () => {
  const { purpose } = useParams();
  const navigate = useNavigate();

  const decodedPurpose = decodeURIComponent(purpose || '');

  const initialState = {
    name: '',
    pen: '',
    recruitmentNumber: '',
    trainingCompany: '',
    mobileNumber: '',
    emergencyContact: '',
    address: '',
    designation: '',
    unit: '',
    district: '',
    courseDetails: '',
    remark: '',
    roomNumber: '',
    allocationDate: '',
    purpose: decodedPurpose
  };

  const [formData, setFormData] = useState(initialState);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^[0-9]{6,}$/.test(formData.pen)) {
      alert('PEN number must be at least 6 digits.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Room allocated successfully!');
        navigate('/BlockHeadDashboard');
      } else {
        alert('Error allocating room.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('Failed to connect to server.');
    }
  };

  const renderFields = () => {
    switch (decodedPurpose) {
      case 'Basic Training':
        return <>
          <div className="form-group">
            <label>Recruitment Number:</label>
            <input type="text" name="recruitmentNumber" value={formData.recruitmentNumber} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Training Company:</label>
            <input type="text" name="trainingCompany" value={formData.trainingCompany} onChange={handleChange} required />
          </div>
        </>;
      case 'Inservice Training':
      case 'Guest / Faculty':
        return <>
          <div className="form-group">
            <label>Unit:</label>
            <input type="text" name="unit" value={formData.unit} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>District:</label>
            <input type="text" name="district" value={formData.district} onChange={handleChange} required />
          </div>
          <div className="form-group full-width">
            <label>Course Details:</label>
            <input type="text" name="courseDetails" value={formData.courseDetails} onChange={handleChange} required />
          </div>
          {decodedPurpose === 'Guest / Faculty' && (
            <div className="form-group full-width">
              <label>Remark:</label>
              <input type="text" name="remark" value={formData.remark} onChange={handleChange} />
            </div>
          )}
        </>;
      case 'KEPA Officials':
      case 'Others':
        return <>
          <div className="form-group">
            <label>Unit:</label>
            <input type="text" name="unit" value={formData.unit} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>District:</label>
            <input type="text" name="district" value={formData.district} onChange={handleChange} required />
          </div>
        </>;
      default:
        return null;
    }
  };

  return (
    <div className="allocate-room-container form-wrapper">
      <h2>Room Allocation Form</h2>
      <form onSubmit={handleSubmit} className="allocation-form">
        <div className="form-group">
          <label>Purpose of Visit:</label>
          <input type="text" name="purpose" value={formData.purpose} readOnly />
        </div>
        <div className="form-group">
          <label>Name:</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>PEN Number:</label>
          <input type="text" name="pen" value={formData.pen} onChange={handleChange} required />
        </div>

        {renderFields()}

        <div className="form-group">
          <label>Mobile Number:</label>
          <input type="text" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Emergency Contact Number:</label>
          <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} required />
        </div>
        <div className="form-group full-width">
          <label>Address (Office or Home):</label>
          <textarea name="address" value={formData.address} onChange={handleChange} required rows="3" />
        </div>
        <div className="form-group">
          <label>Designation:</label>
          <input type="text" name="designation" value={formData.designation} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Allocation Date:</label>
          <input type="date" name="allocationDate" value={formData.allocationDate} onChange={handleChange} required />
        </div>

        <div className="form-group room-check full-width">
          <div className="room-input">
            <label>Room Number:</label>
            <input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleChange} required />
          </div>
          <button type="button" className="check-vacancy-btn" onClick={() => navigate('/blocks-rooms')}>
            Check Vacancies
          </button>
        </div>

        <div className="form-group full-width">
          <button type="submit" className="submit-btn">Allocate Room</button>
        </div>
      </form>
    </div>
  );
};

export default AllocateForm;