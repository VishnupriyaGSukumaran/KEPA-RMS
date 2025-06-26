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

    fetch(`http://localhost:5000/api/blockheadnew/${pen}`)
      .then(res => res.json())
      .then(user => {
        setUserData(user);

        if (user.userType === 'blockhead' && user.assignedBlock) {
          setBlockName(user.assignedBlock);

          fetch(`http://localhost:5000/api/block/name/${encodeURIComponent(user.assignedBlock)}`)
            .then(res => {
              if (!res.ok) {
                throw new Error(`Block "${user.assignedBlock}" not found`);
              }
              return res.json();
            })
            .then(data => setBlockData(data))
            .catch(err => {
              console.error('Error fetching block data:', err);
              alert(`Assigned block "${user.assignedBlock}" does not exist. You will be logged out.`);
              localStorage.clear();
              window.location.href = '/login';
            });
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

  const totalBeds = blockData?.totalBeds || 0;
  const vacantBeds = blockData?.vacantBeds || 0;
  const roomTypeCounts = blockData?.roomTypeCounts || {};

  return (
    <>
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
            <a href="#"><FaList /> Display Block</a>
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
    </>
  );
};

export default BlockHeadDashboard;
