import React from 'react';
import './AdminDashboard.css';
import {
  FaHome,
  FaTh,
  FaUsers,
  FaClipboardList,
  FaBell,
  FaSignOutAlt,
  FaChartBar,
  FaCubes
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const navigate = useNavigate(); // 👈 Step 1: useNavigate hook

  return (
    <div className="admin-dashboard">
      {/* Left Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <img src="/logo.png" alt="logo" />
          <div className="rams-text">RAMS<br /><span>Kerala Police</span></div>
        </div>
        <div className="user-info">
          <img className="avatar" src="/avatar.png" alt="user" />
          <div>
            <div className="username">Admin User</div>
            <div className="email">admin@policeacademy.edu</div>
          </div>
        </div>
        <div className="nav-section">
          <button className="nav-item active"><FaTh /> Dashboard</button>
          <div className="nav-heading">MANAGEMENT</div>
          <button className="nav-item"><FaCubes /> Blocks & Rooms</button>

          {/* ✅ Step 2: Add navigate to this button */}
          <button className="nav-item" onClick={() => navigate('/admin/blockheads')}>
            <FaUsers /> Block heads
          </button>

          <button className="nav-item"><FaClipboardList /> Allocations</button>
          <button className="nav-item"><FaChartBar /> Reports</button>
          <button className="nav-item"><FaBell /> Notifications</button>
        </div>
        <button className="logout"><FaSignOutAlt /> Logout</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="top-bar">
          <h2>ADMIN</h2>
          <div className="home-btn"><FaHome /> Home</div>
        </div>

        {/* Dashboard Stats */}
        <div className="stats-grid">
          <div className="card"><div>Total Blocks</div><strong>12</strong></div>
          <div className="card"><div>Allocated Rooms</div><strong>84</strong></div>
          <div className="card"><div>Vacant Rooms</div><strong>28</strong></div>
          <div className="card"><div>Pending Order</div><strong>5</strong></div>
        </div>

        {/* Notifications */}
        <div className="notifications-section">
          <div className="notif-header">
            <h3>Recent Notifications</h3>
            <span className="view-all">View All</span>
          </div>

          <div className="notif-item">
            <FaBell />
            <div>
              <strong>Allocation confirmed by Block Head</strong><br />
              Block D - Room 305 has been allocated to Inspector Sharma<br />
              <small>30 minutes ago</small>
            </div>
          </div>

          <div className="notif-item">
            <FaBell />
            <div>
              <strong>Vacancy notification</strong><br />
              Block A - Room 112 is now vacant<br />
              <small>2 hours ago</small>
            </div>
          </div>

          <div className="notif-item">
            <FaBell />
            <div>
              <strong>Maintenance request</strong><br />
              Block C - AC not working in Room 208<br />
              <small>5 hours ago</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
