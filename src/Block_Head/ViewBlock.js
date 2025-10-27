import React, { useEffect, useState } from 'react';
import './ViewBlock.css';
import { useParams, useNavigate } from 'react-router-dom';

const ViewBlock = () => {
  const { blockName } = useParams();
  const navigate = useNavigate();
  const [blockData, setBlockData] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [fromAllocate, setFromAllocate] = useState(false);
  const [allocationData, setAllocationData] = useState([]);

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

    localStorage.setItem('triggerViewBlockRefresh', 'true');

    const fetchAllocations = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/allocations/block/${encodeURIComponent(decodedBlockName)}`);
        const data = await response.json();
        setAllocationData(data);
      } catch (err) {
        console.error('Failed to fetch allocation data:', err);
      }
    };

    // ✅ Auto-refresh after vacate
    const refreshListener = setInterval(() => {
      if (localStorage.getItem('triggerViewBlockRefresh') === 'true') {
        fetchBlockData();
        fetchAllocations();
        localStorage.removeItem('triggerViewBlockRefresh');
      }
    }, 1500);

    fetchBlockData();
    fetchAllocations();

    const isFromAllocate = localStorage.getItem('fromAllocateForm') === 'true';
    if (isFromAllocate) {
      setFromAllocate(true);
      localStorage.removeItem('fromAllocateForm');
    }

    return () => clearInterval(refreshListener);
  }, [decodedBlockName]);

  const getDotClass = (status) => {
    if (status === 'allocated') return 'dot red';
    if (status === 'vacant') return 'dot green';
    if (status === 'partial') return 'dot yellow';
    return 'dot gray';
  };

  const computeRoomStatus = (beds = []) => {
    const allocatedCount = beds.filter(b => b.status === 'allocated').length;
    if (allocatedCount === 0) return 'vacant';
    if (allocatedCount === beds.length) return 'allocated';
    return 'partial';
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
      navigate(-1);
    }
  };

  const groupedRoomsByType = blockData?.createdRooms?.reduce((acc, room) => {
    if (!acc[room.roomType]) acc[room.roomType] = [];
    acc[room.roomType].push(room);
    return acc;
  }, {});

  return (
    <div className="view-block-container">
      <h2>Block Overview - {blockData?.blockName || 'Loading...'}</h2>

      <div className="summary-boxes">
        <div className="box">Total Rooms <span>{blockData?.createdRooms?.length || 0}</span></div>
        <div className="box">Room Types <span>{[...new Set(blockData?.createdRooms?.map(r => r.roomType))].join(', ')}</span></div>
        <div className="box">Total Beds <span>{blockData?.totalBeds || 0}</span></div>
        <div className="box">Occupied Beds <span>{(blockData?.totalBeds || 0) - (blockData?.vacantBeds || 0)}</span></div>
        <div className="box">Available Beds <span>{blockData?.vacantBeds || 0}</span></div>
      </div>

      {fromAllocate && (
        <button className="back-button" onClick={goBackToForm}>← Back to Allocation Form</button>
      )}

      {groupedRoomsByType && Object.entries(groupedRoomsByType).map(([type, rooms]) => (
        <div key={type}>
          <h3>{type} Overview</h3>
          {['Dormitory', 'Barrack'].includes(type) ? (
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
                {rooms.map(room => (
                  <tr key={room._id}>
                    <td>{room.roomName}</td>
                    <td>{room.bedCount}</td>
                    <td>{room.allocatedBeds || 0}</td>
                    <td>{(room.bedCount || 0) - (room.allocatedBeds || 0)}</td>
                    <td><button onClick={() => openDetail(room)}>👁️ View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <>
              <div className="dot-legend">
                <span className="dot green"></span> Vacant
                <span className="dot red"></span> Allocated
                <span className="dot yellow"></span> Partial
              </div>
              <table className="overview-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Structure</th>
                    <th>Features</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room._id}>
                      <td><span className={getDotClass(computeRoomStatus(room.beds))}></span></td>
                      <td>{room.roomName}</td>
                      <td>
                        {room.beds?.map((bed, i) => (
                          <span
                            key={i}
                            className={getDotClass(bed.status)}
                            title={`Bed ${bed.bedNumber}: ${bed.status}${bed.occupantName ? ` - ${bed.occupantName}` : ''}`}
                            onClick={() => {
                              if (fromAllocate && bed.status === 'vacant') {
                                localStorage.setItem('selectedRoom', room.roomName);
                                localStorage.setItem('selectedBedNumber', bed.bedNumber);
                                navigate(`/blockhead/AllocateForm/${localStorage.getItem('purpose')}`);
                              }
                            }}
                          ></span>
                        ))}
                      </td>
                      <td>
                        {[room.isAC && 'AC', room.attachedBathroom && 'Attached Bathroom']
                          .filter(Boolean)
                          .concat(Object.keys(room.additionalFacilities || {}))
                          .join(', ') || '-'}
                      </td>
                      <td><button onClick={() => openDetail(room)}>👁️ View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      ))}

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedRoom?.roomName} - Details</h3>
            {selectedRoom?.beds?.length ? (
              <ul>
                {selectedRoom.beds.map((bed, idx) => (
                  <li key={idx}>
                    Bed {bed.bedNumber}: {bed.status}{bed.occupantName ? ` - ${bed.occupantName}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Occupied: {selectedRoom.allocatedBeds || 0}</p>
            )}
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewBlock;
