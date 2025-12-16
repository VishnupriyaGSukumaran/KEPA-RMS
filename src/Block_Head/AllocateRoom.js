// AllocateRoom.js - UPDATED with Notifications & Reports
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaDoorOpen,
  FaDoorClosed,
  FaList,
  FaBell,
  FaFileAlt
} from 'react-icons/fa';

import './AllocateRoom.css';

const purposes = [
  { title: 'Basic Training', description: 'For participants attending basic training programs' },
  { title: 'Inservice Training', description: 'For staff attending inservice training programs' },
  { title: 'Guest / Faculty', description: 'For staff attending programs' },
  { title: 'KEPA Officials', description: 'For officials from KEPA organization' },
  { title: 'Others', description: 'For any other purpose' }
];

const AllocateRoom = () => {
  const [visibleCards, setVisibleCards] = useState([]);
  const navigate = useNavigate();
  
  const pen = localStorage.getItem('pen');
  const blockNameFromStorage = localStorage.getItem('assignedBlock');
  const [userData, setUserData] = useState(null);
  const [blockName, setBlockName] = useState(blockNameFromStorage || '');
  const [unreadCount, setUnreadCount] = useState(0);

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
        
        if (blockToFetch) {
          setBlockName(blockToFetch);
          
          // Fetch unread notifications count
          fetch(`http://localhost:5000/api/allocations/block/${encodeURIComponent(blockToFetch)}`)
            .then(res => res.json())
            .then(notifications => {
              const unread = notifications.filter(n => !n.isRead).length;
              setUnreadCount(unread);
            })
            .catch(err => console.error('Error fetching notifications:', err));
        }
      })
      .catch(err => {
        console.error('Error fetching user data:', err);
      });
  }, [pen, blockNameFromStorage]);

  useEffect(() => {
    let timeout;
    purposes.forEach((_, idx) => {
      timeout = setTimeout(() => {
        setVisibleCards((prev) => [...prev, idx]);
      }, idx * 150);
    });
    return () => clearTimeout(timeout);
  }, []);

  const handleCardClick = (purpose) => {
    const encodedPurpose = encodeURIComponent(purpose);
    navigate(`/blockhead/AllocateForm/${encodedPurpose}`);
  };

  return (
    <>
      <div className="dashboard-containeer">
        <aside className="sidebaar">
          <div className="profile">
            <h3>{userData ? `Insp. ${userData.firstName} ${userData.lastName}` : 'Loading...'}</h3>
            <p>Block Head - {blockName || ''}</p>
          </div>
          <nav className="menu">
            <Link to={`/blockhead/dashboard/${blockName}`}><FaTachometerAlt /> Dashboard</Link>
            <Link to="/blockhead/AllocateRoom" className="active"><FaDoorOpen /> Allocate Room</Link>
            <Link to="/blockhead/VacateRoom"><FaDoorClosed /> Vacate Room</Link>
            <Link to={`/blockhead/ViewBlock/${blockName}`}><FaList /> Display Block</Link>
            <Link to="/blockhead/notifications" style={{ position: 'relative' }}>
              <FaBell /> Notifications
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '8px',
                  right: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  borderRadius: '50%',
                  padding: '2px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link to="/blockhead/reports"><FaFileAlt /> Reports</Link>
          </nav>
        </aside>

        <main className="allocate-room-container">
          <h3>Allocate Room</h3>
          <h4>Select Purpose of Visit</h4>
          <p>Choose the purpose to proceed with room allocation</p>

          <div className="purpose-card-box">
            <div className="purpose-card-container">
              {purposes.map((item, idx) => (
                <div
                  key={idx}
                  className={`purpose-card fade-in ${visibleCards.includes(idx) ? 'visible' : ''}`}
                  onClick={() => handleCardClick(item.title)}
                >
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AllocateRoom;