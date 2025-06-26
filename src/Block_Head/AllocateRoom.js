import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaDoorOpen,
  FaDoorClosed,
  FaList,
  FaHome,
  FaSignOutAlt
} from 'react-icons/fa';
import './BlockHeadDashboard.css';
import './AllocateRoom.css'; // Or AllocationRoom.css if that's the real filename

const purposes = [
  { title: 'Basic Training', description: 'For participants attending basic training programs' },
  { title: 'Inservice Training', description: 'For staff attending inservice training programs' },
  { title: 'Guest / Faculty', description: 'For staff attending programs' },
  { title: 'KEPA Officials', description: 'For officials from KEPA organization' },
  { title: 'Others', description: 'For any other purpose' }
];

const AllocateRoom = () => {
  const [visibleCards, setVisibleCards] = useState([]);
  console.log("Visible cards:", visibleCards);

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
    navigate(`/blockhead/AllocateForm/${encodedPurpose}`);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <>
      {/* 🔴 Removed extra topbar here */}

      <div className="dashboard-container" style={{ marginTop: '60px' }}>
        <aside className="sidebar">
          <div className="profile">
            <h3>Insp. Rajesh Kumar</h3>
            <p>Block Head - A Block</p>
          </div>
          <nav className="menu">
            <Link to="/blockhead/dashboard/A Block"><FaTachometerAlt /> Dashboard</Link>
            <Link to="/blockhead/AllocateRoom/AllocateForm" className="active"><FaDoorOpen /> Allocate Room</Link>
            <Link to="/blockhead/vacate-room/A Block"><FaDoorClosed /> Vacate Room</Link>
            <Link to="/blockhead/display-block/A Block"><FaList /> Display Block</Link>
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
