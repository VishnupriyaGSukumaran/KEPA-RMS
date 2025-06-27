// ✅ File: components/VacateRoom.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './VacateRoom.css';

const VacateRoom = () => {
  const [idType, setIdType] = useState('pen');
  const [idValue, setIdValue] = useState('');
  const [name, setName] = useState('');
  const [vacatingDate, setVacatingDate] = useState('');
  const [paid, setPaid] = useState('');
  const [personDetails, setPersonDetails] = useState(null);
  const navigate = useNavigate();

  const handleViewDetails = async () => {
    if (!idValue) return alert('Please enter an ID value.');

    try {
      const res = await axios.post('http://localhost:5000/api/allocate/fetch-person',
        idType === 'pen' ? { pen: idValue } : { recruitmentNumber: idValue });

      setPersonDetails(res.data);
      setName(res.data.name); // Autofill name from backend if present
    } catch (error) {
      alert(error.response?.data?.error || 'Error fetching details');
    }
  };

  const handleConfirmVacate = async () => {
    if (!personDetails || !vacatingDate || !paid) {
      alert('Please complete all fields.');
      return;
    }

    if (paid === 'No') {
      try {
        await axios.delete(`http://localhost:5000/api/allocate/${personDetails._id}`);
        alert('Room vacated successfully.');
        window.location.reload();
      } catch (error) {
        alert('Error vacating.');
      }
    } else {
      navigate('/payment', {
        state: {
          person: personDetails,
          vacatingDate
        }
      });
    }
  };

  return (
    <div className="vacate-container">
      <h2>Vacate Personnel</h2>
      <div className="vacate-form-group">
        <label>Name (Optional - will autofill on View)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name or wait for autofill"
        />

        <label>ID Type</label>
        <select value={idType} onChange={(e) => setIdType(e.target.value)}>
          <option value="pen">PEN</option>
          <option value="recruitmentNumber">Recruitment Number</option>
        </select>

        <label>{idType === 'pen' ? 'PEN Number' : 'Recruitment Number'}</label>
        <input value={idValue} onChange={(e) => setIdValue(e.target.value)} />

        <label>Vacating Date</label>
        <input type="date" value={vacatingDate} onChange={(e) => setVacatingDate(e.target.value)} />

        <label>Paid</label>
        <select value={paid} onChange={(e) => setPaid(e.target.value)}>
          <option value="">--Select--</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      <div className="vacate-buttons">
        <button onClick={handleViewDetails}>View Details</button>
        <button onClick={() => window.location.reload()}>Cancel</button>
        <button onClick={handleConfirmVacate}>Confirm Vacate</button>
      </div>

      {personDetails && (
        <div className="person-details">
          <h4>Personnel Details</h4>
          <p><strong>Name:</strong> {personDetails.name}</p>
          <p><strong>PEN:</strong> {personDetails.pen}</p>
          <p><strong>Recruitment Number:</strong> {personDetails.recruitmentNumber}</p>
          <p><strong>Mobile:</strong> {personDetails.mobileNumber}</p>
          <p><strong>Emergency Contact:</strong> {personDetails.emergencyContact}</p>
          <p><strong>Designation:</strong> {personDetails.designation}</p>
          <p><strong>Unit:</strong> {personDetails.unit}</p>
          <p><strong>District:</strong> {personDetails.district}</p>
          <p><strong>Address:</strong> {personDetails.address}</p>
          <p><strong>Room:</strong> {personDetails.roomNumber}</p>
          <p><strong>Block:</strong> {personDetails.block}</p>
          <p><strong>Training Company:</strong> {personDetails.trainingCompany}</p>
          <p><strong>Allocation Date:</strong> {new Date(personDetails.allocationDate).toLocaleDateString()}</p>
          <p><strong>Purpose:</strong> {personDetails.purpose}</p>
          <p><strong>Course Details:</strong> {personDetails.courseDetails}</p>
          <p><strong>Remark:</strong> {personDetails.remark}</p>
        </div>
      )}
    </div>
  );
};

export default VacateRoom;