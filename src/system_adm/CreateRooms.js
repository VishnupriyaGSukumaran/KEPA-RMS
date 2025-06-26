import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateRoom.css';

const CreateRoomDashboard = () => {
  const navigate = useNavigate();
  const [blockData, setBlockData] = useState(null);
  const [activeType, setActiveType] = useState('');
  const [roomDetails, setRoomDetails] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const data = JSON.parse(sessionStorage.getItem('blockData'));
    if (!data) return navigate('/superadmin/design-block');
    setBlockData(data);

    const initial = {};
    data.blockTypes.forEach(type => {
      initial[type] = Array.from({ length: data.roomCounts[type] }, () => ({
        roomName: '',
        isAC: false,
        attachedBathroom: false,
        floorNumber: '',
        bedCount: '',
        additionalFacilities: {}
      }));
    });
    setRoomDetails(initial);
    setActiveType(data.blockTypes[0]);
  }, [navigate]);

  const handleChange = (type, index, field, value) => {
    const updated = { ...roomDetails };
    if (field === 'additionalFacilities') {
      updated[type][index].additionalFacilities = value;
    } else {
      updated[type][index][field] = value;
    }
    setRoomDetails(updated);
  };

  const addFacility = (type, index) => {
    const facility = prompt('Enter new facility name (e.g. TV, WiFi):');
    if (facility) {
      const updated = { ...roomDetails };
      updated[type][index].additionalFacilities[facility] = '';
      setRoomDetails(updated);
    }
  };

 const handleSave = async () => {
  // Validation
  for (const type of blockData.blockTypes) {
    const rooms = roomDetails[type];
    for (const room of rooms) {
      if (!room.roomName || room.floorNumber === '' || room.bedCount === '') {
        setModalMessage(`❌ Please fill all details for ${type}`);
        setShowModal(true);
        return;
      }
    }
  }

  try {
    const allRooms = [];
    for (const type of blockData.blockTypes) {
      roomDetails[type].forEach(room => {
        allRooms.push({
          blockName: blockData.blockName,
          roomType: type,
          allocatedBeds: 0,
          ...room
        });
      });
    }

    // ✅ First Save to Block DB
    const blockRes = await fetch('http://localhost:5000/api/block', {
      method: 'POST',
      headers: { 'Content-Type': '' },
      body: JSON.stringify({
        blockName: blockData.blockName,
        blockTypes: blockData.blockTypes,
        roomCounts: blockData.roomCounts,
        createdRooms: allRooms
      })
    });

    // ✅ Then Save to Room DB
    const roomRes = await fetch('http://localhost:5000/api/room/superadmin/create-rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockName: blockData.blockName, rooms: allRooms })
    });

    const blockResult = await blockRes.json();
    const roomResult = await roomRes.json();

    if (blockRes.ok && roomRes.ok) {
sessionStorage.setItem('createdRooms', JSON.stringify(roomResult.blockTypeDetails));

      sessionStorage.removeItem('blockData');
      setModalMessage('✅ Block and Room details saved successfully! Redirecting...');
      setShowModal(true);
      setTimeout(() => {
        setShowModal(false);
        navigate('/superadmin/Add-block');
      }, 2000);
    } else {
      const errorMsg = blockResult.message || roomResult.message || '❌ Failed to save data';
      setModalMessage(errorMsg);
      setShowModal(true);
    }
  } catch (err) {
    console.error(err);
    setModalMessage('❌ Server error');
    setShowModal(true);
  }
};


  if (!blockData) return null;

  return (
    <div className="dashboard-container">
      {/* <header className="dashboard-header">
        <div className="left-section">
          <img src="/logo.png" alt="Kerala Police Logo" className="logo" />
          <div className="title-group">
            <div className="title">RAMS</div>
            <div className="subtitle">Kerala Police Academy</div>
          </div>
        </div>
        <h2 className="center-title">System Admin</h2>
        <div className="nav-buttons">
          <button onClick={() => navigate('/')}>Home</button>
          <button onClick={() => navigate('/login')}>Logout</button>
        </div>
      </header> */}

      <div className="form-area">
        <h3>Block: {blockData.blockName}</h3>
        <div className="button-group">
          {blockData.blockTypes.map(type => (
            <button
              key={type}
              className={activeType === type ? 'active-btn' : 'type-btn'}
              onClick={() => setActiveType(type)}
            >
              {type} ({blockData.roomCounts[type]})
            </button>
          ))}
        </div>

        <div className="room-section">
          {roomDetails[activeType].map((room, i) => (
            <div key={i} className="room-entry">
              <input
                type="text"
                placeholder="Room Name"
                value={room.roomName}
                onChange={(e) => handleChange(activeType, i, 'roomName', e.target.value)}
              />
              <input
                type="number"
                placeholder="Floor Number"
                value={room.floorNumber}
                onChange={(e) => handleChange(activeType, i, 'floorNumber', e.target.value)}
              />
              <input
                type="number"
                placeholder="Number of Beds"
                value={room.bedCount}
                onChange={(e) => handleChange(activeType, i, 'bedCount', e.target.value)}
              />
              <label>
                <input
                  type="checkbox"
                  checked={room.isAC}
                  onChange={(e) => handleChange(activeType, i, 'isAC', e.target.checked)}
                />
                AC
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={room.attachedBathroom}
                  onChange={(e) => handleChange(activeType, i, 'attachedBathroom', e.target.checked)}
                />
                Attached Bathroom
              </label>

              {/* Additional Facilities */}
              {Object.keys(room.additionalFacilities).map((facilityKey) => (
                <input
                  key={facilityKey}
                  type="text"
                  placeholder={facilityKey}
                  value={room.additionalFacilities[facilityKey]}
                  onChange={(e) =>
                    handleChange(activeType, i, 'additionalFacilities', {
                      ...room.additionalFacilities,
                      [facilityKey]: e.target.value
                    })
                  }
                />
              ))}

              <button type="button" onClick={() => addFacility(activeType, i)}>
                + Add Facility
              </button>
            </div>
          ))}
        </div>

        <button className="save-btn" onClick={handleSave}>Save Room Details</button>
      </div>

      {showModal && (
        <div className="success-modal-overlay">
          <div className="success-modal-box">
            <p>{modalMessage}</p>
            <button onClick={() => setShowModal(false)} className="success-button">OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateRoomDashboard;
