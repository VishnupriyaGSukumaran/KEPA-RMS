// BlockHeadDashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBed, FaUsers, FaDoorOpen,
  FaTachometerAlt, FaDoorClosed, FaList
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './BlockHeadDashboard.css';

const BlockHeadDashboard = () => {
  const pen = localStorage.getItem('pen');
  const blockNameFromStorage = localStorage.getItem('assignedBlock');
  const [blockData, setBlockData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [blockName, setBlockName] = useState(blockNameFromStorage || '');

  useEffect(() => {
    if (!pen) return;

    fetch(`http://localhost:5000/api/auth/blockheadnew/${pen}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch user data');
        }
        return res.json();
      })
      .then(user => {
        console.log('👤 User data received:', user);
        setUserData(user);

        const blockToFetch = (user.userType === 'blockhead' && user.assignedBlock) 
          ? user.assignedBlock 
          : blockNameFromStorage;
        
        console.log('🏢 Block to fetch:', blockToFetch);

        if (!blockToFetch) {
          console.warn('No block name available');
          return;
        }

        setBlockName(blockToFetch);

        fetch(`http://localhost:5000/api/block/name/${encodeURIComponent(blockToFetch)}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`Block "${blockToFetch}" not found`);
            }
            return res.json();
          })
          .then(data => {
            console.log('📊 Block data received:', data);
            console.log('📊 Total Beds:', data.totalBeds);
            console.log('📊 Vacant Beds:', data.vacantBeds);
            console.log('📊 Room Type Counts:', data.roomTypeCounts);
            
            if (data.message && !data.totalBeds) {
              console.error('Backend error:', data.message);
              return;
            }
            setBlockData(data);
            if (data._id) {
              localStorage.setItem('blockId', data._id);
            }
          })
          .catch(err => {
            console.error('Error fetching block data:', err);
            if (user.userType === 'blockhead' && user.assignedBlock) {
              alert(`Assigned block "${user.assignedBlock}" does not exist. You will be logged out.`);
              localStorage.clear();
              window.location.href = '/login';
            }
          });
      })
      .catch(err => {
        console.error('Error fetching user data:', err);
      });
  }, [pen, blockNameFromStorage]);

  const totalBeds = blockData?.totalBeds || 0;
  const vacantBeds = blockData?.vacantBeds || 0;
  const allocatedBeds = totalBeds - vacantBeds;
  const roomTypeCounts = blockData?.roomTypeCounts || {};

  // Calculate statistics for each room type
  const calculateRoomTypeStats = () => {
    if (!blockData?.createdRooms) return {};

    const stats = {};

    blockData.createdRooms.forEach(room => {
      const roomType = room.roomType || 'Unknown';
      
      if (!stats[roomType]) {
        stats[roomType] = {
          totalRooms: 0,
          totalBeds: 0,
          allocatedBeds: 0,
          vacantBeds: 0,
          fullyOccupied: 0,
          partialOccupied: 0,
          vacant: 0
        };
      }

      const totalBedsInRoom = room.beds?.length || room.bedCount || 0;
      const allocatedInRoom = room.allocatedBeds || 0;
      const vacantInRoom = totalBedsInRoom - allocatedInRoom;

      stats[roomType].totalRooms++;
      stats[roomType].totalBeds += totalBedsInRoom;
      stats[roomType].allocatedBeds += allocatedInRoom;
      stats[roomType].vacantBeds += vacantInRoom;

      if (allocatedInRoom === 0) {
        stats[roomType].vacant++;
      } else if (allocatedInRoom === totalBedsInRoom) {
        stats[roomType].fullyOccupied++;
      } else {
        stats[roomType].partialOccupied++;
      }
    });

    return stats;
  };

  const roomTypeStats = calculateRoomTypeStats();

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          padding: '12px 18px',
          border: '2px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: 0, fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>
            {payload[0].payload.name}
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.4rem', fontWeight: 'bold', color: payload[0].payload.fill }}>
            {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="dashboard-containerr">
        <aside className="sidebarr">
          <div className="profile">
            <h3>{userData ? `Insp. ${userData.firstName} ${userData.lastName}` : 'Loading...'}</h3>
            <p>Block Head - {blockName || ''}</p>
          </div>
          <nav className="menu">
            <Link to={`/blockhead/dashboard/${blockName}`}><FaTachometerAlt /> Dashboard</Link>
            <Link to={`/blockhead/AllocateRoom`}><FaDoorOpen /> Allocate Room</Link>
            <Link to={`/blockhead/VacateRoom`}><FaDoorClosed /> Vacate Room</Link>
            <Link to={`/blockhead/ViewBlock/${blockName}`}><FaList /> Display Block</Link>
          </nav>
        </aside>
        
        <main className="main-contentt">
          <h3>{blockName?.toUpperCase() || ''} ROOM ALLOCATION</h3>

          <h4>Block Statistics</h4>
          <div className="stats">
            {Object.entries(roomTypeCounts).map(([type, count]) => (
              <div key={type} className="stat-card blue">
                <h5>{type}</h5>
                <p>{count}</p>
                <FaDoorOpen className="icon" />
              </div>
            ))}

            <div className="stat-card green">
              <h5>Total Beds</h5>
              <p>{totalBeds}</p>
              <FaBed className="icon" />
            </div>

            <div className="stat-card red">
              <h5>Vacant Beds</h5>
              <p>{vacantBeds}</p>
              <FaUsers className="icon" />
            </div>
          </div>

          {/* Room Type Allocation Charts */}
          <div style={{ marginTop: '3rem' }}>
            <h4 style={{ marginBottom: '1.5rem' }}>Room Type Allocation Status</h4>
            
            {/* Legend */}
            <div style={{
              display: 'flex',
              gap: '2rem',
              marginBottom: '2rem',
              fontSize: '0.95rem',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  height: '12px',
                  width: '12px',
                  borderRadius: '50%',
                  display: 'inline-block',
                  backgroundColor: '#e74c3c'
                }}></span>
                <span>Allocated</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  height: '12px',
                  width: '12px',
                  borderRadius: '50%',
                  display: 'inline-block',
                  backgroundColor: '#2ecc71'
                }}></span>
                <span>Vacant</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  height: '12px',
                  width: '12px',
                  borderRadius: '50%',
                  display: 'inline-block',
                  backgroundColor: '#f1c40f'
                }}></span>
                <span>Partial</span>
              </div>
            </div>

            {/* Individual Charts for Each Room Type */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '2rem'
            }}>
              {Object.entries(roomTypeStats).map(([roomType, stats]) => {
                const chartData = [
                  { name: 'Allocated', count: stats.allocatedBeds, fill: '#e74c3c' },
                  { name: 'Vacant', count: stats.vacantBeds, fill: '#2ecc71' },
                  { name: 'Partial', count: stats.partialOccupied, fill: '#f1c40f' }
                ];

                return (
                  <div key={roomType} style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h5 style={{
                      margin: '0 0 1rem 0',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#14008a',
                      borderBottom: '2px solid #14008a',
                      paddingBottom: '0.5rem'
                    }}>
                      {roomType}
                    </h5>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>{stats.totalRooms}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Total Rooms</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>{stats.totalBeds}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Total Beds</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{stats.vacantBeds}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Vacant</div>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                        barSize={60}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12, fill: '#374151', fontWeight: '500' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      backgroundColor: '#f0f4ff',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: '#333'
                    }}>
                      <strong>Status:</strong> {stats.fullyOccupied} Fully Occupied • {stats.partialOccupied} Partial • {stats.vacant} Vacant
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default BlockHeadDashboard;