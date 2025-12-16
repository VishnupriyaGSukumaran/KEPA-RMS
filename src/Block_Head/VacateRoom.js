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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleBackClick = () => {
    navigate(-1);
  };

  const handleViewDetails = async () => {
    if (!idValue) {
      alert('Please enter an ID value.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/roomallocations/fetch-person',
        idType === 'pen' ? { pen: idValue } : { recruitmentNumber: idValue });

      setPersonDetails(res.data);
      setName(res.data.name);
    } catch (error) {
      alert(error.response?.data?.error || 'Error fetching details');
    }
  };

  const handleConfirmVacate = async () => {
    if (!personDetails) {
      alert('Please click "View Details" first to fetch personnel information.');
      return;
    }

    if (!vacatingDate || !paid) {
      alert('Please complete Vacating Date and Paid fields.');
      return;
    }

    setLoading(true);

    try {
      if (paid === 'Yes') {
        // If paid = Yes, go to payment page
        navigate('/payment', {
          state: {
            person: personDetails,
            vacatingDate
          }
        });
        return;
      }

      // ✅ PAID = NO - DELETE WITH VACATING DETAILS
      console.log('🔴 Starting vacation process for:', personDetails.name);
      console.log('📋 Allocation ID:', personDetails._id);
      console.log('📅 Vacating Date:', vacatingDate);
      console.log('💰 Paid:', paid);
      
      // ✅ Send DELETE request WITH vacating details in body
      const deleteResponse = await axios.delete(
        `http://localhost:5000/api/roomallocations/${personDetails._id}`,
        {
          data: {
            vacatingDate: vacatingDate,
            paid: paid,
            vacatedBy: localStorage.getItem('username') || 'System'
          }
        }
      );
      
      console.log('✅ Response:', deleteResponse.data);
      
      // Clear triggers and refresh
      localStorage.removeItem('triggerViewBlockRefresh');
      await new Promise(resolve => setTimeout(resolve, 300));
      localStorage.setItem('triggerViewBlockRefresh', Date.now().toString());
      
      alert('✅ Room vacated successfully! Vacating details saved to database.');

      // Navigate back to block view
      navigate(`/blockhead/ViewBlock/${encodeURIComponent(personDetails.blockName || personDetails.block)}`, {
        replace: true,
        state: { 
          forceRefresh: true,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('❌ Vacation error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMsg = error.response?.data?.error 
        || error.response?.data?.details
        || error.message 
        || 'Error vacating room.';
      
      alert(`❌ Error: ${errorMsg}\n\nPlease check the console for details.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vacate-container">
      <button className="back-button" onClick={handleBackClick}>← Back</button>
      <h2>Vacate Personnel</h2>
      <div className="vacate-form-group">
        <label>Name (Optional - will autofill on View)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name or wait for autofill"
          disabled={!!personDetails}
        />

        <label>ID Type</label>
        <select value={idType} onChange={(e) => setIdType(e.target.value)}>
          <option value="pen">PEN</option>
          <option value="recruitmentNumber">Recruitment Number</option>
        </select>

        <label>{idType === 'pen' ? 'PEN Number' : 'Recruitment Number'}</label>
        <input 
          value={idValue} 
          onChange={(e) => setIdValue(e.target.value)}
          placeholder={`Enter ${idType === 'pen' ? 'PEN' : 'Recruitment'} Number`}
        />

        <label>Vacating Date <span style={{color: 'red'}}>*</span></label>
        <input 
          type="date" 
          value={vacatingDate} 
          onChange={(e) => setVacatingDate(e.target.value)}
          required
        />

        <label>Paid <span style={{color: 'red'}}>*</span></label>
        <select value={paid} onChange={(e) => setPaid(e.target.value)} required>
          <option value="">--Select--</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      <div className="vacate-buttons">
        <button onClick={handleViewDetails} disabled={loading}>
          View Details
        </button>
        <button onClick={() => window.location.reload()} disabled={loading}>
          Cancel
        </button>
        <button 
          onClick={handleConfirmVacate}
          disabled={!personDetails || loading}
          style={{
            opacity: (!personDetails || loading) ? 0.5 : 1,
            cursor: (!personDetails || loading) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : 'Confirm Vacate'}
        </button>
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
          <p><strong>Block:</strong> {personDetails.blockName || personDetails.block}</p>
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