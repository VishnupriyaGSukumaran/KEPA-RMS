import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaTachometerAlt, FaDoorOpen, FaDoorClosed, FaList, FaHome, FaSignOutAlt
} from 'react-icons/fa';
import './BlockHeadDashboard.css';
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
    navigate(`/allocate-form/${encodedPurpose}`);
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

        <main className="main-content allocate-room-container">
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
