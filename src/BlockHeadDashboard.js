import React from 'react';
import './BlockHeadDashboard.css';
import {
  FaBed, FaUsers, FaDoorOpen, FaHome,
  FaSignOutAlt, FaTachometerAlt, FaDoorClosed, FaList
} from 'react-icons/fa';

const BlockHeadDashboard = () => {
  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <img src="/logo.png" alt="Logo" />
          <div className="text-group">
            <h2>RMS</h2>
            <p>Kerala Police Academy</p>
          </div>
        </div>
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
            <a href="/AllocateRoom"><FaDoorOpen /> Allocate Room</a>
            <a href="/VacateRoom"><FaDoorClosed /> Vacate Room</a>
            <a href="#"><FaList /> Display Block</a>
          </nav>
        </aside>

        <main className="main-content">
          <h3>A BLOCK ROOM ALLOCATION</h3>

          <div className="legend">
            <span className="dot green"></span> Vacant
            <span className="dot red"></span> Allocated
            <span className="dot yellow"></span> Partial
          </div>

          <h4>Block Statistic</h4>
          <div className="stats">
            <div className="stat-card blue">
              <h5>Total Rooms</h5>
              <p>35</p>
              <h5>Dormetry</h5>
              <p>1</p>
              <FaDoorOpen className="icon" />
            </div>
            <div className="stat-card green">
              <h5>Total Beds</h5>
              <p>88</p>
              <FaBed className="icon" />
            </div>
            <div className="stat-card red">
              <h5>Vacant Beds</h5>
              <p>26</p>
              <FaUsers className="icon" />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default BlockHeadDashboard;
