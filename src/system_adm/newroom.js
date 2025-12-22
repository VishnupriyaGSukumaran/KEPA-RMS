import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './newroom.css';

const CreateModifyRooms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [roomDetails, setRoomDetails] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [blockData, setBlockData] = useState(null);

  useEffect(() => {
    // Get data from navigation state
    const navData = location.state;
    
    if (!navData || !navData.blockId || !navData.roomType || !navData.roomCount) {
      alert('Missing required data. Redirecting...');
      navigate('/superadmin/modify-block');
      return;
    }

    console.log('📦 Received navigation data:', navData);
    setBlockData(navData);

    // Initialize room details array
    const initial = Array.from({ length: navData.roomCount }, () => ({
      roomName: '',
      isAC: false,
      attachedBathroom: false,
      floorNumber: '',
      bedCount: '',
      additionalFacilities: {}
    }));
    
    setRoomDetails(initial);
  }, [location, navigate]);

  const handleChange = (index, field, value) => {
    const updated = [...roomDetails];
    if (field === 'additionalFacilities') {
      updated[index].additionalFacilities = value;
    } else {
      updated[index][field] = value;
    }
    setRoomDetails(updated);
  };

  const addFacility = (index) => {
    const facility = prompt('Enter new facility name (e.g. TV, WiFi):');
    if (facility && facility.trim()) {
      const updated = [...roomDetails];
      updated[index].additionalFacilities[facility.trim()] = '';
      setRoomDetails(updated);
    }
  };

  const handleSave = async () => {
    if (!blockData) {
      alert('Block data missing');
      return;
    }

    // ✅ VALIDATION
    const roomNames = new Set();
    for (const room of roomDetails) {
      // Check required fields
      if (!room.roomName || !room.roomName.trim()) {
        setModalMessage(`❌ Room name is required for all rooms`);
        setShowModal(true);
        return;
      }
      if (room.floorNumber === '' || room.floorNumber === null) {
        setModalMessage(`❌ Floor number is required for all rooms`);
        setShowModal(true);
        return;
      }
      if (room.bedCount === '' || room.bedCount === null) {
        setModalMessage(`❌ Bed count is required for all rooms`);
        setShowModal(true);
        return;
      }

      // Check for duplicates
      const trimmedName = room.roomName.trim();
      if (roomNames.has(trimmedName)) {
        setModalMessage(`❌ Duplicate room name "${trimmedName}" found`);
        setShowModal(true);
        return;
      }
      roomNames.add(trimmedName);
    }

    try {
      console.log(`🔄 Saving ${roomDetails.length} rooms for block: ${blockData.blockName}`);
      
      // ✅ Prepare rooms with beds array
      const roomsToCreate = roomDetails.map(room => {
        const bedCount = parseInt(room.bedCount) || 0;
        const beds = Array.from({ length: bedCount }, (_, i) => ({
          bedNumber: i + 1,
          status: 'vacant',
          occupantName: ''
        }));

        return {
          blockName: blockData.blockName,
          roomType: blockData.roomType,
          roomName: room.roomName.trim(),
          floorNumber: parseInt(room.floorNumber),
          bedCount: bedCount,
          isAC: room.isAC,
          attachedBathroom: room.attachedBathroom,
          additionalFacilities: room.additionalFacilities || {},
          allocatedBeds: 0,
          beds: beds
        };
      });

      console.log(`📦 Rooms prepared:`, roomsToCreate.map(r => r.roomName).join(', '));

      // ✅ CRITICAL FIX: Save rooms using the SAME endpoint as CreateRoom.js
      // This endpoint handles BOTH Room collection AND Block document updates
      const roomRes = await fetch('http://localhost:5000/api/room/superadmin/create-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          blockName: blockData.blockName, 
          rooms: roomsToCreate 
        })
      });

      // ✅ Check response
      if (!roomRes.ok) {
        const errorData = await roomRes.json();
        throw new Error(errorData.message || 'Failed to create rooms');
      }

      const roomResult = await roomRes.json();
      
      console.log(`✅ Room creation response:`, roomResult);

      // ✅ Show success message
      setModalMessage(`✅ ${roomsToCreate.length} room(s) created successfully! Redirecting...`);
      setShowModal(true);
      
      // ✅ Wait before redirect to ensure backend updates complete
      setTimeout(() => {
        setShowModal(false);
        console.log(`🔄 Redirecting to modify page...`);
        
        // ✅ Navigate with state to trigger refresh
        navigate('/superadmin/modify-block', {
          state: { 
            refreshBlock: blockData.blockId,
            refreshBlockName: blockData.blockName,
            timestamp: Date.now()
          },
          replace: true
        });
      }, 2000);

    } catch (err) {
      console.error('❌ Error creating rooms:', err);
      setModalMessage(`❌ ${err.message || 'Server error while creating rooms'}`);
      setShowModal(true);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
      navigate('/superadmin/modify-block');
    }
  };

  if (!blockData) {
    return (
      <div className="dashboard-container">
        <div className="form-area">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="form-area">
        <h3>Create Rooms for {blockData.blockName}</h3>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Room Type: <strong>{blockData.roomType}</strong> | 
          Rooms to Create: <strong>{blockData.roomCount}</strong>
          {blockData.isAdditional && <span style={{ color: '#ff9800' }}> (Additional Rooms)</span>}
        </p>

        <div className="room-section">
          {roomDetails.map((room, i) => (
            <div key={i} className="room-entry">
              <h4 style={{ marginBottom: '10px', color: '#333' }}>Room {i + 1}</h4>
              
              <input
                type="text"
                placeholder="Room Name *"
                value={room.roomName}
                onChange={(e) => handleChange(i, 'roomName', e.target.value)}
                required
              />
              
              <input
                type="number"
                placeholder="Floor Number *"
                value={room.floorNumber}
                onChange={(e) => handleChange(i, 'floorNumber', e.target.value)}
                required
              />
              
              <input
                type="number"
                placeholder="Number of Beds *"
                value={room.bedCount}
                onChange={(e) => handleChange(i, 'bedCount', e.target.value)}
                min="1"
                required
              />
              
              <label>
                <input
                  type="checkbox"
                  checked={room.isAC}
                  onChange={(e) => handleChange(i, 'isAC', e.target.checked)}
                />
                AC Available
              </label>
              
              <label>
                <input
                  type="checkbox"
                  checked={room.attachedBathroom}
                  onChange={(e) => handleChange(i, 'attachedBathroom', e.target.checked)}
                />
                Attached Bathroom
              </label>

              {/* Additional Facilities */}
              {Object.keys(room.additionalFacilities).length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <strong>Additional Facilities:</strong>
                  {Object.keys(room.additionalFacilities).map((facilityKey) => (
                    <input
                      key={facilityKey}
                      type="text"
                      placeholder={facilityKey}
                      value={room.additionalFacilities[facilityKey]}
                      onChange={(e) =>
                        handleChange(i, 'additionalFacilities', {
                          ...room.additionalFacilities,
                          [facilityKey]: e.target.value
                        })
                      }
                    />
                  ))}
                </div>
              )}

              <button 
                type="button" 
                onClick={() => addFacility(i)}
                style={{ 
                  backgroundColor: '#6c757d',
                  marginTop: '10px'
                }}
              >
                + Add Facility
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button className="save-btn" onClick={handleSave}>
            Create {roomDetails.length} Room(s)
          </button>
          <button 
            className="cancel-btn" 
            onClick={handleCancel}
            style={{ 
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {showModal && (
        <div className="success-modal-overlay">
          <div className="success-modal-box">
            <p>{modalMessage}</p>
            <button onClick={() => setShowModal(false)} className="success-button">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateModifyRooms;