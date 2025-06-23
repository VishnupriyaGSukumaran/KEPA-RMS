import React, { useEffect, useState } from 'react';
import './ViewBlock.css';
import { FaHome, FaSignOutAlt } from 'react-icons/fa';

const ViewBlock = () => {
  const [blockData, setBlockData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const pen = localStorage.getItem('pen');

  useEffect(() => {
    if (pen) {
      fetch(`http://localhost:5000/api/blockheadnew/${pen}`)
        .then(res => res.json())
        .then(user => {
          setUserData(user);
          if (user.assignedBlock) {
            fetch(`http://localhost:5000/api/block/name/${encodeURIComponent(user.assignedBlock)}`)
              .then(res => res.json())
              .then(data => setBlockData(data));
          }
        });
    }
  }, [pen]);

  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const getDotClass = (status) => {
    if (status === 'allocated') return 'dot red';
    if (status === 'vacant') return 'dot green';
    if (status === 'partial') return 'dot yellow';
    return 'dot gray';
  };

  const openDetail = (room) => {
    setSelectedRoom(room);
    setShowModal(true);
  };

  return (
    <>
      {/* ✅ Topbar same as BlockHeadDashboard */}
      {/* <header className="topbar">
        <div className="topbar-left">
          <img src="/logo.png" alt="Logo" />
          <div className="text-group">
            <h2>RMS</h2>
            <p>Kerala Police Academy</p>
          </div>
        </div>
        <div className="topbar-actions">
          <a href="#"><FaHome /> Home</a>
          <a onClick={logout} style={{ cursor: 'pointer' }}><FaSignOutAlt /> Logout</a>
        </div>
      </header> */}

      <div className="view-block-container">
        <h2>Block Overview - {blockData?.blockName || 'Loading...'}</h2>

        <div className="summary-boxes">
          <div className="box">Total Rooms <span>{blockData?.createdRooms?.length || 0}</span></div>
          <div className="box">Dormitory <span>{blockData?.createdRooms?.filter(r => r.roomType === 'Dormitory').length || 0}</span></div>
          <div className="box">Total Beds <span>{blockData?.totalBeds || 0}</span></div>
          <div className="box">Occupied Beds <span>{(blockData?.totalBeds || 0) - (blockData?.vacantBeds || 0)}</span></div>
          <div className="box">Available Beds <span>{blockData?.vacantBeds || 0}</span></div>
        </div>

        <h3>Room Overview</h3>
        <table className="overview-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Structure</th>
              <th>Features</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blockData?.createdRooms?.filter(r => r.roomType !== 'Dormitory').map((room, idx) => (
              <tr key={idx}>
                <td>{room.roomName}</td>
                <td>{room.beds?.map((bed, i) => <span key={i} className={getDotClass(bed.status)}></span>)}</td>
                <td>{room.features || '-'}</td>
                <td>
                  <button onClick={() => openDetail(room)}>👁️ View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Dormitory Overview</h3>
        <table className="overview-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Capacity</th>
              <th>Occupied Beds</th>
              <th>Available</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {blockData?.createdRooms?.filter(r => r.roomType === 'Dormitory').map((dorm, idx) => (
              <tr key={idx}>
                <td>{dorm.roomName}</td>
                <td>{dorm.bedCount}</td>
                <td>{dorm.occupiedCount || 0}</td>
                <td>{(dorm.bedCount || 0) - (dorm.occupiedCount || 0)}</td>
                <td>
                  <button onClick={() => openDetail(dorm)}>👁️ View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ✅ Modal */}
        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>{selectedRoom?.roomName} - Details</h3>
              {selectedRoom?.beds?.length ? (
                <ul>
                  {selectedRoom.beds.map((bed, idx) => (
                    <li key={idx}>Bed {idx + 1}: {bed.status} {bed.occupantName ? `- ${bed.occupantName}` : ''}</li>
                  ))}
                </ul>
              ) : (
                <p>Occupied: {selectedRoom.occupiedCount || 0}</p>
              )}
              <button onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ViewBlock;
