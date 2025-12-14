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
  const [showBedModal, setShowBedModal] = useState(false);
  const [fromAllocate, setFromAllocate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const decodedBlockName = decodeURIComponent(blockName);

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
  }, [decodedBlockName]);

  const fetchAllocations = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/allocations/block/${encodeURIComponent(decodedBlockName)}`);
      const data = await response.json();
      console.log('Allocations fetched:', data);
    } catch (err) {
      console.error('Failed to fetch allocation data:', err);
    }
  }, [decodedBlockName]);

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
  }, [decodedBlockName, location.state, fetchBlockData, fetchAllocations]);

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

  const openBedView = (room) => {
    setSelectedRoom(room);
    setShowBedModal(true);
  };

  const goBackToForm = () => {
    const purpose = localStorage.getItem('purpose');
    if (purpose) {
      navigate(`/blockhead/AllocateForm/${encodeURIComponent(purpose)}`);
    } else {
      navigate(-1);
    }
  };
    // ✅ NEW: Back button handler
  const handleBackClick = () => {
    navigate(-1);
  };

  const groupedRoomsByType = blockData?.createdRooms?.reduce((acc, room) => {
    if (!acc[room.roomType]) acc[room.roomType] = [];
    acc[room.roomType].push(room);
    return acc;
  }, {});

  return (
    <div className="view-block-container" key={refreshKey}>
       <button className="back-button" onClick={handleBackClick}>← Back</button>
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
          
          {/* ✅ UNIFIED TABLE STRUCTURE FOR ALL ROOM TYPES */}
          {['Dormitory', 'Barrack'].includes(type) ? (
            // Dormitory & Barrack - Simple table with View Beds button
            <>
              <div className="dot-legend">
                <span className="dot green"></span> Vacant
                <span className="dot red"></span> Allocated
              </div>
              <table className="overview-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Capacity</th>
                    <th>Occupied Beds</th>
                    <th>Available</th>
                    <th>Structure</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(room => {
                    const totalBeds = room.beds?.length || room.bedCount || 0;
                    const occupiedBeds = room.allocatedBeds || 0;
                    const availableBeds = totalBeds - occupiedBeds;
                    const roomStatus = occupiedBeds === 0 ? 'vacant' : 
                                      occupiedBeds === totalBeds ? 'allocated' : 'partial';
                    
                    return (
                      <tr key={`${room._id}-${refreshKey}`}>
                        <td><span className={getDotClass(roomStatus)}></span></td>
                        <td>{room.roomName}</td>
                        <td>{totalBeds}</td>
                        <td>{occupiedBeds}</td>
                        <td>{availableBeds}</td>
                        <td>
                          <button 
                            className="view-beds-btn"
                            onClick={() => openBedView(room)}
                          >
                            View Beds ({totalBeds})
                          </button>
                        </td>
                        <td><button onClick={() => openDetail(room)}>👁️ View Details</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          ) : (
            // Suite Room, Single Room, etc. - Detailed table with features
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
                        <button 
                          className="view-beds-btn"
                          onClick={() => openBedView(room)}
                        >
                          View Beds ({room.beds?.length || 0})
                        </button>
                      </td>
                      <td>
                        {[room.isAC && 'AC', room.attachedBathroom && 'Attached Bathroom']
                          .filter(Boolean)
                          .concat(Object.keys(room.additionalFacilities || {}))
                          .join(', ') || '-'}
                      </td>
                      <td><button onClick={() => openDetail(room)}>👁️ View Details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      ))}

      {/* ✅ BED VIEW MODAL - WORKS FOR ALL ROOM TYPES */}
      {showBedModal && selectedRoom && (
        <div className="modal" onClick={() => setShowBedModal(false)}>
          <div className="modal-content bed-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedRoom.roomName} - Bed Allocation</h3>
            <div className="bed-modal-legend">
              <span className="dot green"></span> Vacant
              <span className="dot red"></span> Allocated
            </div>
            
            <div className="bed-stats">
              <div className="stat-item">
                <strong>Total Beds:</strong> <span>{selectedRoom.beds?.length || selectedRoom.bedCount || 0}</span>
              </div>
              <div className="stat-item">
                <strong>Occupied:</strong> <span>{selectedRoom.allocatedBeds || 0}</span>
              </div>
              <div className="stat-item">
                <strong>Available:</strong> <span>{(selectedRoom.beds?.length || selectedRoom.bedCount || 0) - (selectedRoom.allocatedBeds || 0)}</span>
              </div>
            </div>

            <div className="bed-grid">
              {selectedRoom.beds?.map((bed, idx) => (
                <div
                  key={`${selectedRoom._id}-bed-${idx}-${refreshKey}`}
                  className={`bed-item ${bed.status}`}
                  onClick={() => {
                    if (fromAllocate && bed.status === 'vacant') {
                      localStorage.setItem('selectedRoom', selectedRoom.roomName);
                      localStorage.setItem('selectedBedNumber', bed.bedNumber);
                      navigate(`/blockhead/AllocateForm/${localStorage.getItem('purpose')}`);
                    }
                  }}
                  style={{ cursor: fromAllocate && bed.status === 'vacant' ? 'pointer' : 'default' }}
                >
                  <span className={getDotClass(bed.status)}></span>
                  <div className="bed-info">
                    <strong>Bed {bed.bedNumber}</strong>
                    <small className={bed.status === 'allocated' ? 'status-allocated' : 'status-vacant'}>
                      {bed.status}
                    </small>
                    {bed.occupantName && <small className="occupant">👤 {bed.occupantName}</small>}
                  </div>
                </div>
              ))}
            </div>
            
            {fromAllocate && (
              <p className="allocation-hint">💡 Click on a vacant bed to select it for allocation</p>
            )}
            
            <button className="modal-close-btn" onClick={() => setShowBedModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ✅ DETAILS MODAL */}
      {showModal && selectedRoom && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedRoom.roomName} - Full Details</h3>
            
            <div className="detail-section">
              <h4>Room Information</h4>
              <p><strong>Type:</strong> {selectedRoom.roomType}</p>
              <p><strong>Total Capacity:</strong> {selectedRoom.beds?.length || selectedRoom.bedCount || 0} beds</p>
              <p><strong>Occupied:</strong> {selectedRoom.allocatedBeds || 0} beds</p>
              <p><strong>Available:</strong> {(selectedRoom.beds?.length || selectedRoom.bedCount || 0) - (selectedRoom.allocatedBeds || 0)} beds</p>
            </div>

            {selectedRoom.beds?.length > 0 && (
              <div className="detail-section">
                <h4>Bed Details</h4>
                <ul className="bed-detail-list">
                  {selectedRoom.beds.map((bed, idx) => (
                    <li key={idx} className={bed.status}>
                      <span className={getDotClass(bed.status)}></span>
                      <strong>Bed {bed.bedNumber}:</strong> {bed.status}
                      {bed.occupantName && ` - ${bed.occupantName}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(selectedRoom.isAC || selectedRoom.attachedBathroom || Object.keys(selectedRoom.additionalFacilities || {}).length > 0) && (
              <div className="detail-section">
                <h4>Features</h4>
                <ul className="features-list">
                  {selectedRoom.isAC && <li>✓ Air Conditioned</li>}
                  {selectedRoom.attachedBathroom && <li>✓ Attached Bathroom</li>}
                  {Object.keys(selectedRoom.additionalFacilities || {}).map(feature => (
                    <li key={feature}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            )}

            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewBlock;