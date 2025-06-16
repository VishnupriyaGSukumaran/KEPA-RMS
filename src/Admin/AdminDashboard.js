import React, { useState } from 'react';
import './AdminDashboard.css';
import {
  FaHome,
  FaTh,
  FaUsers,
  FaClipboardList,
  FaBell,
  FaSignOutAlt,
  FaChartBar,
  FaCubes,
  FaBook
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminDashboard() {
  const navigate = useNavigate();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');

  // Submit course suggestion to SuperAdmin
  const handleCourseSubmit = async () => {
    if (!courseTitle || !courseDesc) {
      alert('Please enter course title and description.');
      return;
    }

    const message = `New course suggestion: "${courseTitle}" - ${courseDesc}`;

    try {
  await axios.post('http://localhost:5000/api/notifications', { message });
      alert('Course suggestion sent to SuperAdmin.');
      setCourseTitle('');
      setCourseDesc('');
      setShowModal(false);
    } catch (error) {
      console.error('Failed to send course suggestion:', error);
      alert('Failed to notify SuperAdmin.');
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <img src="/logo.png" alt="logo" />
          <div className="rams-text">RMS<br /><span>Kerala Police</span></div>
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
          <button className="nav-item" onClick={() => navigate('/admin/blockheads')}>
            <FaUsers /> Block heads
          </button>
          <button className="nav-item"><FaClipboardList /> Allocations</button>
          <button className="nav-item"><FaCubes /> Blocks & Rooms</button>
           <button className="nav-item" onClick={() => setShowModal(true)}>
            <FaBook /> Suggest Course
          </button>
          
          <button className="nav-item"><FaChartBar /> Reports</button>
          <button className="nav-item"><FaBell /> Notifications</button>

         
        </div>

        <button className="logout" onClick={() => navigate('/login')}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="top-bar">
          <h2>ADMIN</h2>
          <div className="home-btn" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <FaHome /> Home
          </div>
        </div>

        {/* Stats */}
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

      {/* Modal for Suggest Course */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '400px'
            
          }}>
            <h3>Suggest New Course</h3>
            <input
              type="text"
              placeholder="Course Title"
              value={courseTitle}
              onChange={e => setCourseTitle(e.target.value)}
              style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
            />
            <textarea
              placeholder="Course Description"
              value={courseDesc}
              onChange={e => setCourseDesc(e.target.value)}
              rows={4}
              style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ marginRight: '10px', padding: '6px 12px' }}
              >Cancel</button>
              <button
                onClick={handleCourseSubmit}
                style={{ backgroundColor: '#007bff', color: 'white', padding: '6px 12px' }}
              >Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default AdminDashboard;
