import React, { useEffect, useState } from 'react';
import './BlockHeadDashboard.css';
import {
  FaBed, FaUsers, FaDoorOpen, FaHome,
  FaSignOutAlt, FaTachometerAlt, FaDoorClosed, FaList
} from 'react-icons/fa';

const BlockHeadDashboard = () => {
  const pen = localStorage.getItem('pen');
  const [blockData, setBlockData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [blockName, setBlockName] = useState('');

  useEffect(() => {
    if (!pen) {
      console.warn('No PEN found in localStorage');
      return;
    }

    // ✅ UPDATED FETCH URL to /api/blockheadnew
    fetch(`http://localhost:5000/api/blockheadnew/${pen}`)
      .then(res => res.json())
      .then(user => {
        console.log('Fetched user:', user);
        setUserData(user);

        if (user.userType === 'blockhead' && user.assignedBlock) {
          setBlockName(user.assignedBlock);

          fetch(`http://localhost:5000/api/block/name/${encodeURIComponent(user.assignedBlock)}`)
            .then(res => res.json())
            .then(data => {
              console.log('Fetched block:', data);
              setBlockData(data);
            })
            .catch(err => console.error('Error fetching block data:', err));
        } else {
          console.warn('User is not a blockhead or has no assigned block');
        }
      })
      .catch(err => console.error('Error fetching user data:', err));
  }, [pen]);

  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const totalRooms = blockData?.createdRooms?.length || 0;
  const totalBeds = blockData?.createdRooms?.reduce(
    (sum, room) => sum + (room.bedCount || 0), 0
  );
  const vacantBeds = blockData?.vacantBeds || 0;

  const dormitoryCount = blockData?.createdRooms?.filter(
    room => room.roomType === 'Dormitory'
  ).length || 0;

  return (
    <>
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

      <div className="dashboard-container">
        <aside className="sidebar">
          <div className="profile">
            <h3>{userData ? `Insp. ${userData.firstName} ${userData.lastName}` : 'Loading...'}</h3>
            <p>Block Head - {blockName || '...'}</p>
          </div>
          <nav className="menu">
            <a href="#"><FaTachometerAlt /> Dashboard</a>
            <a href="/AllocateRoom"><FaDoorOpen /> Allocate Room</a>
            <a href="/VacateRoom"><FaDoorClosed /> Vacate Room</a>
            <a href="/ViewBlock"><FaList /> Display Block</a>
          </nav>
        </aside>

        <main className="main-content">
          <h3>{blockName?.toUpperCase() || 'LOADING'} ROOM ALLOCATION</h3>

          <div className="legend">
            <span className="dot green"></span> Vacant
            <span className="dot red"></span> Allocated
            <span className="dot yellow"></span> Partial
          </div>

          <h4>Block Statistics</h4>
          <div className="stats">
            <div className="stat-card blue">
              <h5>Total Rooms</h5>
              <p>{totalRooms}</p>
              <h5>Dormitories</h5>
              <p>{dormitoryCount}</p>
              <FaDoorOpen className="icon" />
            </div>
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
        </main>
      </div>
    </>
  );
};

export default BlockHeadDashboard;