// src/AllocateRoom.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt, FaDoorOpen, FaDoorClosed, FaList, FaHome, FaSignOutAlt
} from 'react-icons/fa';
import './BlockHeadDashboard.css';

const purposes = [
  { title: 'Basic Training', description: 'For participants attending basic training programs' },
  { title: 'Inservice Training', description: 'For staff attending inservice training programs' },
  { title: 'Guest / Faculty', description: 'For faculty and guests' },
  { title: 'KEPA Officials', description: 'For officials from KEPA organization' },
  { title: 'Others', description: 'For any other purpose' }
];

const AllocateRoom = () => {
  const navigate = useNavigate();

  const handleCardClick = (purpose) => {
    navigate('/allocate-form', { state: { purpose } });
  };

  return (
    <>
      <header className="topbar">
        <h2>Block Head</h2>
        <div className="topbar-actions">
          <a href="#"><FaHome /> Home</a>
          <a href="#"><FaSignOutAlt /> Logout</a>
        </div>
      </header>

      <div className="dashboard-container">
        <aside className="sidebar">
          <div className="profile">
            <h3>Insp. Rajesh Kumar</h3>
            <p>Block Head - A Block</p>
          </div>
          <nav className="menu">
            <a href="#"><FaTachometerAlt /> Dashboard</a>
            <a href="#" className="active"><FaDoorOpen /> Allocate Room</a>
            <a href="#"><FaDoorClosed /> Vacate Room</a>
            <a href="#"><FaList /> Display Block</a>
          </nav>
        </aside>

        <main className="main-content">
          <h3>Allocate Room</h3>
          <p><strong>Select Purpose of Visit</strong></p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
            {purposes.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleCardClick(item.title)}
                style={{
                  flex: '1 1 200px',
                  border: '1px solid #ccc',
                  borderRadius: '10px',
                  padding: '1rem',
                  background: '#fff',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  cursor: 'pointer'
                }}
              >
                <h4>{item.title}</h4>
                <p style={{ fontSize: '0.9rem', color: '#555' }}>{item.description}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
};

export default AllocateRoom;
