import React, { useEffect, useState } from 'react';
import './ViewBlock.css';
import { useParams, useNavigate } from 'react-router-dom';
import { FaHome, FaSignOutAlt } from 'react-icons/fa';

const ViewBlock = () => {
  const { blockName } = useParams();
  const navigate = useNavigate();
  const [blockData, setBlockData] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const decodedBlockName = decodeURIComponent(blockName);

  useEffect(() => {
    const fetchBlockData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/block/name/${encodeURIComponent(decodedBlockName)}`);
        if (!response.ok) throw new Error('Block not found');
        const data = await response.json();
        setBlockData(data);
      } catch (error) {
        console.error('Error fetching block data:', error);
      }
    };

    if (decodedBlockName) {
      fetchBlockData();
    }
  }, [decodedBlockName]);

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

  const goBackToForm = () => {
    const purpose = localStorage.getItem('purpose');
    if (purpose) {
      navigate(`/blockhead/AllocateForm/${encodeURIComponent(purpose)}`);
    } else {
      navigate(-1); // fallback to browser back
    }
  };

  return (
    <>
      <div className="view-block-container">
        <h2>Block Overview - {blockData?.blockName || 'Loading...'}</h2>

        <div className="summary-boxes">
          <div className="box">Total Rooms <span>{blockData?.createdRooms?.length || 0}</span></div>
          <div className="box">Dormitory <span>{blockData?.createdRooms?.filter(r => r.roomType === 'Dormitory').length || 0}</span></div>
          <div className="box">Total Beds <span>{blockData?.totalBeds || 0}</span></div>
          <div className="box">Occupied Beds <span>{(blockData?.totalBeds || 0) - (blockData?.vacantBeds || 0)}</span></div>
          <div className="box">Available Beds <span>{blockData?.vacantBeds || 0}</span></div>
        </div>

        {/* 🔙 Back Button */}
        <button className="back-button" onClick={goBackToForm}>
          ← Back to Allocation Form
        </button>

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
            {blockData?.createdRooms?.filter(r => r.roomType !== 'Dormitory').map((room) => (
              <tr key={room._id}>
                <td>{room.roomName}</td>
                <td>
                  {room.beds?.length > 0
                    ? room.beds.map((bed, i) => <span key={i} className={getDotClass(bed.status)}></span>)
                    : <span className={getDotClass('vacant')}>•</span>
                  }
                </td>
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
            {blockData?.createdRooms?.filter(r => r.roomType === 'Dormitory').map((dorm) => (
              <tr key={dorm._id}>
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
