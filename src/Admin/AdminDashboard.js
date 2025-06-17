import React, { useState } from 'react';
import './AdminDashboard.css';
import {
  FaHome,
  FaTh,
  FaUsers,
  FaBell,
  FaSignOutAlt,
  FaChartBar,
  FaCubes,
  FaBook,
  FaPlus,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminDashboard() {
  const navigate = useNavigate();

  // Course Modal State
  const [showModal, setShowModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');

  // Group Allocation Form State
  const [showAllocForm, setShowAllocForm] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [officerCount, setOfficerCount] = useState('');
  const [requestedBlock, setRequestedBlock] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [notes, setNotes] = useState('');
  const [officerFile, setOfficerFile] = useState(null);

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const formData = new FormData();
    formData.append('purpose', purpose);
    formData.append('officerCount', officerCount);
    formData.append('requestedBlock', requestedBlock);
    formData.append('fromDate', fromDate);
    formData.append('toDate', toDate);
    formData.append('notes', notes);

    if (officerFile) {
      formData.append('officerFile', officerFile);
    }

    await axios.post('http://localhost:5000/api/allocations', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  
      alert('Allocation order sent successfully!');
      setShowAllocForm(false);

      // Reset form fields
      setPurpose('');
      setOfficerCount('');
      setRequestedBlock('');
      setFromDate('');
      setToDate('');
      setNotes('');
    } catch (err) {
      console.error('Failed to send allocation:', err);
      alert('Failed to send allocation.');
    }
  };

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
          <div className="rams-text">
            RMS
            <br />
            <span>Kerala Police</span>
          </div>
        </div>
        <div className="user-info">
          <img className="avatar" src="/avatar.png" alt="user" />
          <div>
            <div className="username">Admin User</div>
            <div className="email">admin@policeacademy.edu</div>
          </div>
        </div>
        <div className="nav-section">
          <button className="nav-item active">
            <FaTh /> Dashboard
          </button>
          <div className="nav-heading">MANAGEMENT</div>

          <button
            className="nav-item"
            onClick={() => navigate('/admin/blockheads')}
          >
            <FaUsers /> Block heads
          </button>

          <button
            onClick={() => setShowAllocForm(true)}
            className="nav-item"
          >
            <FaPlus /> Create Allocation Order
          </button>

          <button className="nav-item">
            <FaCubes /> Blocks & Rooms
          </button>
          <button className="nav-item" onClick={() => setShowModal(true)}>
            <FaBook /> Suggest Course
          </button>

          <button className="nav-item">
            <FaChartBar /> Reports
          </button>
          <button className="nav-item">
            <FaBell /> Notifications
          </button>
        </div>

        <button className="logout" onClick={() => navigate('/login')}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="top-bar">
          <h2>ADMIN</h2>
          <div
            className="home-btn"
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <FaHome /> Home
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="card">
            <div>Total Blocks</div>
            <strong>12</strong>
          </div>
          <div className="card">
            <div>Allocated Rooms</div>
            <strong>84</strong>
          </div>
          <div className="card">
            <div>Vacant Rooms</div>
            <strong>28</strong>
          </div>
          <div className="card">
            <div>Pending Order</div>
            <strong>5</strong>
          </div>
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
              <strong>Allocation confirmed by Block Head</strong>
              <br />
              Block D - Room 305 has been allocated to Inspector Sharma
              <br />
              <small>30 minutes ago</small>
            </div>
          </div>

          <div className="notif-item">
            <FaBell />
            <div>
              <strong>Vacancy notification</strong>
              <br />
              Block A - Room 112 is now vacant
              <br />
              <small>2 hours ago</small>
            </div>
          </div>

          <div className="notif-item">
            <FaBell />
            <div>
              <strong>Maintenance request</strong>
              <br />
              Block C - AC not working in Room 208
              <br />
              <small>5 hours ago</small>
            </div>
          </div>
        </div>
      </div>

      {/* Suggest Course Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Suggest New Course</h3>
            <input
              type="text"
              placeholder="Course Title"
              value={courseTitle}
              onChange={e => setCourseTitle(e.target.value)}
              style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
              onChange={(e) => setCourseTitle(e.target.value)}
            />
            <textarea
              placeholder="Course Description"
              value={courseDesc}
              onChange={(e) => setCourseDesc(e.target.value)}
              rows={4}
            />
            <div className="form-buttons">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button onClick={handleCourseSubmit}>Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Group Allocation Form Modal */}
      {showAllocForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="allocation-form">
              <h2>Allocation Request</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                 <div className="form-group">
                  <label>Purpose of Visit</label>
                  <select
                     name="purpose"
                     value={purpose}
                     onChange={(e) => setPurpose(e.target.value)}
                    required
                  >
                    <option value="">Select Purpose</option>
                    <option value="Training">Basic Training</option>
                    <option value="Workshop">Inservice Training</option>
                    <option value="Meeting">Faculty/Guest</option>
                    <option value="Inspection">KEPA Officers</option>
                    <option value="Guest Accommodation">Others</option>
                  </select>
                </div>

                  <div className="form-group">
                    <label>Number of Officers</label>
                    <input
                      type="number"
                      name="officerCount"
                      value={officerCount}
                      onChange={(e) => setOfficerCount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Requested Block</label>
                    <select
                      name="requestedBlock"
                      value={requestedBlock}
                      onChange={(e) => setRequestedBlock(e.target.value)}
                      required
                    >
                      <option value="">Select Block</option>
                      <option value="Block A">Block A</option>
                      <option value="Block B">Block B</option>
                      <option value="Block C">Block C</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Upload Officer List</label>
                    <input
                     type="file"
                      accept=".pdf,.xlsx,.xls"
                       onChange={(e) => setOfficerFile(e.target.files[0])}
                      
                      />
                  </div>
                  

                  <div className="form-group">
                    <label>From Date</label>
                    <input
                      type="date"
                      name="fromDate"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>To Date</label>
                    <input
                      type="date"
                      name="toDate"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Remarks / Notes</label>
                    <textarea
                      name="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="form-buttons">
                  <button type="submit" className="save-btn">
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAllocForm(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

