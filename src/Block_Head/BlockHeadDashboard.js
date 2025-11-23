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
    if (!pen) return;

    // Fetch user data first to get correct assignedBlock
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

        // Use assignedBlock from user data, fallback to localStorage
        const blockToFetch = (user.userType === 'blockhead' && user.assignedBlock) 
          ? user.assignedBlock 
          : blockNameFromStorage;
        
        console.log('🏢 Block to fetch:', blockToFetch);

        if (!blockToFetch) {
          console.warn('No block name available');
          return;
        }

        setBlockName(blockToFetch);

        // Fetch block data with stats
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
            
            // Check if response has error message
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
  const roomTypeCounts = blockData?.roomTypeCounts || {};

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

