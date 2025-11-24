import React, { useEffect, useState, useCallback } from 'react';
import './ViewBlock.css';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const ViewBlock = () => {
  const { blockName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [blockData, setBlockData] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [fromAllocate, setFromAllocate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const decodedBlockName = decodeURIComponent(blockName);

  // ✅ Use useCallback to memoize the function
  const fetchBlockData = useCallback(async (forceRefresh = false) => {
    console.log('🔵 Fetching block data for:', decodedBlockName, 'Force:', forceRefresh);
    try {
      const timestamp = Date.now();
      const random = Math.random();
      const url = `http://localhost:5000/api/block/name/${encodeURIComponent(decodedBlockName)}?t=${timestamp}&r=${random}`;
      
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) throw new Error('Block not found');
      const data = await response.json();
      
      console.log('📊 Block data received:', {
        blockName: data.blockName,
        totalBeds: data.totalBeds,
        vacantBeds: data.vacantBeds,
        occupiedBeds: data.totalBeds - data.vacantBeds,
        roomsCount: data.createdRooms?.length
      });
      
      data.createdRooms?.forEach(room => {
        const allocated = room.beds?.filter(b => b.status === 'allocated').length || room.allocatedBeds || 0;
        const vacant = (room.beds?.length || room.bedCount || 0) - allocated;
        console.log(`  Room ${room.roomName}: ${allocated} allocated, ${vacant} vacant`);
        console.log(`    Beds:`, room.beds?.map((b, i) => `${i}:${b.status}`).join(', '));
      });
      
      setBlockData(data);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('❌ Error fetching block data:', error);
    }
  }, [decodedBlockName]); // ✅ Add dependency

  const fetchAllocations = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/allocations/block/${encodeURIComponent(decodedBlockName)}`);
      const data = await response.json();
      // If you need this data, add state: setAllocationData(data);
      console.log('Allocations fetched:', data);
    } catch (err) {
      console.error('Failed to fetch allocation data:', err);
    }
  }, [decodedBlockName]); // ✅ Add dependency

  useEffect(() => {
    console.log('🚀 ViewBlock mounted/updated');
    
    fetchBlockData(true);
    fetchAllocations();

    if (location.state?.forceRefresh) {
      console.log('🔄 Force refresh from navigation state');
      setTimeout(() => {
        fetchBlockData(true);
        fetchAllocations();
      }, 200);
    }

    const refreshListener = setInterval(() => {
      const trigger = localStorage.getItem('triggerViewBlockRefresh');
      if (trigger) {
        console.log('🔄 REFRESH TRIGGERED from localStorage');
        fetchBlockData(true);
        fetchAllocations();
        localStorage.removeItem('triggerViewBlockRefresh');
      }
    }, 100);

    const isFromAllocate = localStorage.getItem('fromAllocateForm') === 'true';
    if (isFromAllocate) {
      setFromAllocate(true);
      localStorage.removeItem('fromAllocateForm');
    }

    return () => {
      console.log('🛑 Cleanup');
      clearInterval(refreshListener);
    };
  }, [decodedBlockName, location.state, fetchBlockData, fetchAllocations]); // ✅ Add all dependencies

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
    <div className="view-block-container" key={refreshKey}>
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
                  <tr key={`${room._id}-${refreshKey}`}>
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
                    <tr key={`${room._id}-${refreshKey}`}>
                      <td><span className={getDotClass(computeRoomStatus(room.beds))}></span></td>
                      <td>{room.roomName}</td>
                      <td>
                        {room.beds?.map((bed, i) => (
                          <span
                            key={`${room._id}-bed-${i}-${refreshKey}`}
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