import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './view.css';

const ViewBlock = () => {
  const { blockName } = useParams();
  const navigate = useNavigate();
  const [blockData, setBlockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRoomType, setExpandedRoomType] = useState(null);
  const [expandedRoom, setExpandedRoom] = useState(null);

  useEffect(() => {
    const fetchBlockDetails = async () => {
      try {
        setLoading(true);
        const url = `http://localhost:5000/api/block/name/${encodeURIComponent(blockName)}`;

        console.log('🔍 Fetching:', url);
        
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('✅ Block data received:', data);
        setBlockData(data);
        setError(null);
      } catch (err) {
        console.error('❌ Error loading block details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlockDetails();
  }, [blockName]);

  const toggleRoomType = (roomType) => {
    if (expandedRoomType === roomType) {
      setExpandedRoomType(null);
      setExpandedRoom(null);
    } else {
      setExpandedRoomType(roomType);
      setExpandedRoom(null);
    }
  };

  const toggleRoom = (roomName) => {
    if (expandedRoom === roomName) {
      setExpandedRoom(null);
    } else {
      setExpandedRoom(roomName);
    }
  };

  const getRoomsByType = (roomType) => {
    return (blockData?.createdRooms || []).filter(room => room.roomType === roomType);
  };

  if (loading) {
    return (
      <div className="view-block-container">
        <p style={{ textAlign: 'center', padding: '50px' }}>Loading block details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-block-container">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <p style={{ color: 'red', textAlign: 'center', padding: '50px' }}>
          Error: {error}
        </p>
      </div>
    );
  }

  if (!blockData) {
    return (
      <div className="view-block-container">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <p style={{ textAlign: 'center', padding: '50px' }}>No block data found.</p>
      </div>
    );
  }

  const rooms = blockData.createdRooms || [];

  return (
    <div className="view-block-container">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
      
      <div className="block-header">
        <h2>{blockData.blockName} — Overview</h2>
      </div>

      {/* Legend */}
      <div className="status-legend">
        <span className="legend-item">
          <span className="status-badge status-vacant">●</span> VACANT
        </span>
        <span className="legend-item">
          <span className="status-badge status-partial">●</span> PARTIAL
        </span>
        <span className="legend-item">
          <span className="status-badge status-allocated">●</span> ALLOCATED
        </span>
      </div>

      {/* Total Beds Card */}
      <div className="total-beds-card">
        <h3>{blockData.totalBeds} TOTAL BEDS</h3>
      </div>

      {/* Room Type Statistics with Expandable Room Details */}
      <h3 className="section-title">Room Types Overview (Click to Expand)</h3>
      <table className="overview-table">
        <thead>
          <tr>
            <th>Room Type</th>
            <th>Total Beds</th>
            <th>Allocated</th>
            <th>Vacant</th>
            <th>Vacant Rooms</th>
            <th>Partial Rooms</th>
            <th>Allocated Rooms</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(blockData.roomTypeStats || {}).map(([type, stats]) => (
            <React.Fragment key={type}>
              <tr 
                className="clickable-row" 
                onClick={() => toggleRoomType(type)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <strong>
                    {expandedRoomType === type ? '▼' : '▶'} {type}
                  </strong>
                </td>
                <td>{stats.totalBeds}</td>
                <td>{stats.allocatedBeds}</td>
                <td>{stats.vacantBeds}</td>
                <td>
                  <span className="status-badge status-vacant">
                    {stats.vacantRooms} room{stats.vacantRooms !== 1 ? 's' : ''}
                  </span>
                </td>
                <td>
                  <span className="status-badge status-partial">
                    {stats.partialRooms} room{stats.partialRooms !== 1 ? 's' : ''}
                  </span>
                </td>
                <td>
                  <span className="status-badge status-allocated">
                    {stats.allocatedRooms} room{stats.allocatedRooms !== 1 ? 's' : ''}
                  </span>
                </td>
              </tr>
              
              {/* Expanded Room List for this Room Type */}
              {expandedRoomType === type && (
                <tr>
                  <td colSpan="7" className="expanded-section">
                    <div className="rooms-list">
                      <h4>Rooms in {type}</h4>
                      <table className="nested-table">
                        <thead>
                          <tr>
                            <th>Room Name</th>
                            <th>Floor</th>
                            <th>Total Beds</th>
                            <th>Allocated</th>
                            <th>Vacant</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getRoomsByType(type).map((room, idx) => {
                            const total = room.bedCount || 0;
                            const allocated = room.allocatedBeds || 0;
                            const vacant = total - allocated;
                            
                            let status = 'Vacant';
                            let statusClass = 'status-vacant';
                            
                            if (allocated > 0 && allocated < total) {
                              status = 'Partial';
                              statusClass = 'status-partial';
                            } else if (allocated >= total && total > 0) {
                              status = 'Allocated';
                              statusClass = 'status-allocated';
                            } else {
                              status = 'Vacant';
                              statusClass = 'status-vacant';
                            }
                            
                            return (
                              <React.Fragment key={idx}>
                                <tr 
                                  className="clickable-row room-row" 
                                  onClick={() => toggleRoom(room.roomName)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <td>
                                    <strong>
                                      {expandedRoom === room.roomName ? '▼' : '▶'} {room.roomName}
                                    </strong>
                                  </td>
                                  <td>Floor {room.floorNumber || 'N/A'}</td>
                                  <td>{total}</td>
                                  <td>{allocated}</td>
                                  <td>{vacant}</td>
                                  <td>
                                    <span className={`status-badge ${statusClass}`}>
                                      {status}
                                    </span>
                                  </td>
                                </tr>
                                
                                {/* Expanded Person Details for this Room */}
                                {expandedRoom === room.roomName && (
                                  <tr>
                                    <td colSpan="6" className="person-details-section">
                                      <div className="person-details">
                                        <h5>Occupants in {room.roomName}</h5>
                                        {room.allocatedBeds > 0 ? (
                                          <div className="person-grid">
                                            {/* Display allocated person details */}
                                            {room.allocatedPersons && room.allocatedPersons.length > 0 ? (
                                              room.allocatedPersons.map((person, pIdx) => (
                                                <div key={pIdx} className="person-card">
                                                  <div className="person-info">
                                                    <p><strong>Name:</strong> {person.name || 'N/A'}</p>
                                                    <p><strong>ID:</strong> {person.id || 'N/A'}</p>
                                                    <p><strong>Department:</strong> {person.department || 'N/A'}</p>
                                                    <p><strong>Phone:</strong> {person.phone || 'N/A'}</p>
                                                    <p><strong>Email:</strong> {person.email || 'N/A'}</p>
                                                    <p><strong>Bed Number:</strong> {person.bedNumber || 'N/A'}</p>
                                                  </div>
                                                </div>
                                              ))
                                            ) : (
                                              <p className="no-data">
                                                {allocated} bed(s) allocated but detailed person information not available.
                                              </p>
                                            )}
                                          </div>
                                        ) : (
                                          <p className="no-data">No occupants - Room is vacant</p>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

    </div>
  );
};

export default ViewBlock;