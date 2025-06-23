// BlockHeadDashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBed, FaUsers, FaDoorOpen,
  FaTachometerAlt, FaDoorClosed, FaList
} from 'react-icons/fa';
import './BlockHeadDashboard.css';

const BlockHeadDashboard = () => {
  const pen = localStorage.getItem('pen');
  const blockNameFromStorage = localStorage.getItem('assignedBlock');
  const [blockData, setBlockData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [blockName, setBlockName] = useState(blockNameFromStorage || '');

  useEffect(() => {
    if (!pen || !blockNameFromStorage) return;

    // Fetch block data
    fetch(`http://localhost:5000/api/block/name/${encodeURIComponent(blockNameFromStorage)}`)
      .then(res => res.json())
      .then(data => setBlockData(data))
      .catch(err => console.error('Error fetching block data:', err));

    // Fetch user data
    fetch(`http://localhost:5000/api/blockheadnew/${pen}`)
      .then(res => res.json())
      .then(user => setUserData(user))
      .catch(err => console.error('Error fetching user data:', err));
  }, [pen, blockNameFromStorage]);

  const totalBeds = blockData?.totalBeds || 0;
  const vacantBeds = blockData?.vacantBeds || 0;
  const roomTypeCounts = blockData?.roomTypeCounts || {};

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="profile">
          <h3>{userData ? `Insp. ${userData.firstName} ${userData.lastName}` : 'Loading...'}</h3>
          <p>Block Head - {blockName || ''}</p>
        </div>
        <nav className="menu">
          <Link to={`/blockhead/dashboard/${blockName}`}><FaTachometerAlt /> Dashboard</Link>
          <Link to={`/blockhead/AllocateRoom`}><FaDoorOpen /> Allocate Room</Link>
          <Link to={`/blockhead/vacate-room/${blockName}`}><FaDoorClosed /> Vacate Room</Link>
          <Link to={`/blockhead/display-block/${blockName}`}><FaList /> Display Block</Link>
        </nav>
      </aside>

      <main className="main-content">
        <h3>{blockName?.toUpperCase() || ''} ROOM ALLOCATION</h3>

        <div className="legend">
          <span className="dot green"></span> Vacant
          <span className="dot red"></span> Allocated
          <span className="dot yellow"></span> Partial
        </div>

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
      </main>
    </div>
  );
};

export default BlockHeadDashboard;
