// AdminDashboard.js - FIXED: Fetch Admin User Details
import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import {
  FaTh,
  FaUsers,
  FaBell,
  FaChartBar,
  FaCubes,
  FaBook,
  FaPlus,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

function AdminDashboard() {
  const navigate = useNavigate();

  // States
  const [showModal, setShowModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');

  const [showAllocForm, setShowAllocForm] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [officerCount, setOfficerCount] = useState('');
  const [requestedBlock, setRequestedBlock] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [notes, setNotes] = useState('');
  const [officerFile, setOfficerFile] = useState(null);
  const [courseFile, setCourseFile] = useState(null);

  // ✅ NEW: Admin User Details State
  const [adminUser, setAdminUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: ''
  });

  // Blocks state for allocation order dropdown
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  // Dashboard statistics state - updated to include room types
  const [dashboardStats, setDashboardStats] = useState({
    totalBlocks: 0,
    totalRooms: 0,
    occupied: 0,
    unoccupied: 0,
    partiallyOccupied: 0,
    roomTypeCounts: {
      room: 0,
      suiteRoom: 0,
      dormitory: 0,
      barrack: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ NEW: Fetch Admin User Details
  useEffect(() => {
    const fetchAdminDetails = async () => {
      try {
        const pen = localStorage.getItem('pen');
        if (!pen) {
          console.error('No PEN found in localStorage');
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/auth/blockheadnew/${pen}`);
        console.log('Admin Details:', response.data);
        
        setAdminUser({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          email: response.data.email || '',
          username: response.data.username || ''
        });
      } catch (error) {
        console.error('Failed to fetch admin details:', error);
        // Set default values if fetch fails
        setAdminUser({
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@policeacademy.edu',
          username: 'admin'
        });
      }
    };

    fetchAdminDetails();
  }, []);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/dashboard/stats');
        console.log('Dashboard API Response:', response.data);
        if (response.data.success) {
          setDashboardStats(response.data.data);
          setError(null);
        } else {
          setError('Failed to load dashboard statistics');
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        console.error('Error details:', error.response?.data || error.message);
        setError(`Failed to load dashboard statistics: ${error.response?.data?.error || error.message}`);
        setDashboardStats({
          totalBlocks: 0,
          totalRooms: 0,
          occupied: 0,
          unoccupied: 0,
          partiallyOccupied: 0,
          roomTypeCounts: {
            room: 0,
            suiteRoom: 0,
            dormitory: 0,
            barrack: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Fetch blocks from backend when allocation form opens
  useEffect(() => {
    const fetchBlocks = async () => {
      if (showAllocForm) {
        try {
          setLoadingBlocks(true);
          const response = await axios.get('http://localhost:5000/api/block');
          console.log('Blocks fetched:', response.data);
          
          if (Array.isArray(response.data) && response.data.length > 0) {
            const blockNames = response.data.map(block => block.blockName).filter(Boolean);
            setBlocks(blockNames);
          } else {
            setBlocks([]);
          }
        } catch (error) {
          console.error('Failed to fetch blocks:', error);
          setBlocks([]);
        } finally {
          setLoadingBlocks(false);
        }
      }
    };

    fetchBlocks();
  }, [showAllocForm]);

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
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Allocation order sent successfully!');
      setShowAllocForm(false);
      setPurpose('');
      setOfficerCount('');
      setRequestedBlock('');
      setFromDate('');
      setToDate('');
      setNotes('');
      setOfficerFile(null);
    } catch (err) {
      console.error('Failed to send allocation:', err);
      alert('Failed to send allocation.');
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();

    if (!courseTitle || !courseDesc) {
      alert('Please enter both title and description.');
      return;
    }

    const formData = new FormData();
    formData.append('courseTitle', courseTitle);
    formData.append('courseDesc', courseDesc);
    if (courseFile) {
      formData.append('courseFile', courseFile);
    }

    try {
      await axios.post('http://localhost:5000/api/course-orders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('✅ Course order sent to SuperAdmin.');
      setCourseTitle('');
      setCourseDesc('');
      setCourseFile(null);
      setShowModal(false);
    } catch (error) {
      console.error('Error submitting course order:', error);
      alert('❌ Failed to send course order.');
    }
  };

  // Chart data for donut chart
  const totalChartData = dashboardStats.occupied + dashboardStats.unoccupied + dashboardStats.partiallyOccupied;
  
  const chartData = {
    labels: ['Occupied', 'Unoccupied', 'Partially Occupied'],
    datasets: [
      {
        label: 'Room Allocation Status',
        data: [
          dashboardStats.occupied,
          dashboardStats.unoccupied,
          dashboardStats.partiallyOccupied
        ],
        backgroundColor: [
          '#dc3545',
          '#28a745',
          '#ffc107'
        ],
        borderColor: [
          '#dc3545',
          '#28a745',
          '#ffc107'
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.5,
    plugins: {
      legend: {
        display: false,
        position: 'bottom',
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  
  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-content">
          <div className="user-info">
            <img className="avatar" src="/avatar.png" alt="user" />
            <div>
              <div className="username">
                {adminUser.firstName && adminUser.lastName 
                  ? `${adminUser.firstName} ${adminUser.lastName}`
                  : 'Admin User'}
              </div>
              <div className="email">
                {adminUser.email || 'admin@policeacademy.edu'}
              </div>
            </div>
          </div>
          <div className="nav-section">
            <button className="nav-item active"><FaTh /> Dashboard</button>
            <div className="nav-heading">MANAGEMENT</div>
            <button className="nav-item" onClick={() => navigate('/admin/blockheads')}><FaUsers /> Assign Block Heads</button>
            <button className="nav-item" onClick={() => setShowAllocForm(true)}><FaPlus /> Create Allocation Order</button>
            <button className="nav-item" onClick={() => navigate('/admin/display-block')}><FaCubes /> Display Block Structure</button>
            <button className="nav-item" onClick={() => setShowModal(true)}><FaBook /> Forward Course Order</button>
            <button 
  className="nav-item" 
  onClick={() => navigate('/admin/reports')}
>
  <FaChartBar /> Generate Reports
</button>
            <button className="nav-item"><FaBell /> Notifications</button>
          </div>
        </div>
      </div>

      {/* Main Content - REMOVED DUPLICATE TOPBAR */}
      <div className="main-content">
        {/* Dashboard Cards */}
        <div className="stats-grid">
          <div className="card card-blue">
            <div className="card-label">TOTAL BLOCKS</div>
            <div className="card-value">{loading ? '...' : dashboardStats.totalBlocks}</div>
          </div>
          <div className="card card-red">
            <div className="card-label">OCCUPIED</div>
            <div className="card-value">{loading ? '...' : dashboardStats.occupied}</div>
          </div>
          <div className="card card-green">
            <div className="card-label">UNOCCUPIED</div>
            <div className="card-value">{loading ? '...' : dashboardStats.unoccupied}</div>
          </div>
          <div className="card card-orange">
            <div className="card-label">PARTIALLY OCCUPIED</div>
            <div className="card-value">{loading ? '...' : dashboardStats.partiallyOccupied}</div>
          </div>
        </div>

        {/* Room Type Breakdown Section */}
        <div className="room-types-section">
          <h3 className="section-title">Room Type Breakdown</h3>
          <div className="room-types-grid">
            <div className="room-type-card">
              <div className="room-type-label">Room</div>
              <div className="room-type-value">{loading ? '...' : dashboardStats.roomTypeCounts?.room || 0}</div>
            </div>
            <div className="room-type-card">
              <div className="room-type-label">Suite Room</div>
              <div className="room-type-value">{loading ? '...' : dashboardStats.roomTypeCounts?.suiteRoom || 0}</div>
            </div>
            <div className="room-type-card">
              <div className="room-type-label">Dormitory</div>
              <div className="room-type-value">{loading ? '...' : dashboardStats.roomTypeCounts?.dormitory || 0}</div>
            </div>
            <div className="room-type-card">
              <div className="room-type-label">Barrack</div>
              <div className="room-type-value">{loading ? '...' : dashboardStats.roomTypeCounts?.barrack || 0}</div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ 
            margin: '20px 30px', 
            padding: '15px', 
            background: '#fff3cd', 
            border: '1px solid #ffc107', 
            borderRadius: '5px',
            color: '#856404'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Room Allocation Status Chart */}
        <div className="chart-section">
          <h3 className="chart-title">Room Allocation Status</h3>
          {totalChartData > 0 ? (
            <>
              <div className="chart-container">
                <Doughnut data={chartData} options={chartOptions} />
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-dot legend-red"></span>
                  <span>Occupied</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot legend-green"></span>
                  <span>Unoccupied</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot legend-orange"></span>
                  <span>Partially Occupied</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#666',
              fontSize: '16px'
            }}>
              No room data available to display chart
            </div>
          )}
        </div>
      </div>

      {/* Suggest Course Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Forward Course Order</h3>
            <form onSubmit={handleCourseSubmit}>
              <div className="form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Course Description</label>
                <textarea
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="form-group">
                <label>Upload Course Order (PDF)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setCourseFile(e.target.files[0])}
                />
              </div>

              <div className="form-buttons">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {showAllocForm && (
        <div className="alloc-modal-backdrop">
          <div className="alloc-modal-container">
            <div className="alloc-modal-header">
              <h2 className="alloc-modal-title">Allocation Order</h2>
            </div>
            <form onSubmit={handleSubmit} className="alloc-modal-body">
              <div className="alloc-form-row">
                <div className="alloc-form-field">
                  <label htmlFor="purpose" className="alloc-label">Purpose of Visit</label>
                  <select 
                    id="purpose"
                    value={purpose} 
                    onChange={(e) => setPurpose(e.target.value)} 
                    required
                    className="alloc-input alloc-select"
                  >
                    <option value="">Select Purpose</option>
                    <option value="Training">Basic Training</option>
                    <option value="Workshop">Inservice Training</option>
                    <option value="Meeting">Faculty/Guest</option>
                    <option value="Inspection">KEPA Officers</option>
                    <option value="Guest Accommodation">Others</option>
                  </select>
                </div>
                
                <div className="alloc-form-field">
                  <label htmlFor="officerCount" className="alloc-label">Number of Officers</label>
                  <input 
                    id="officerCount"
                    type="number" 
                    value={officerCount} 
                    onChange={(e) => setOfficerCount(e.target.value)} 
                    required
                    className="alloc-input"
                    placeholder="Enter number of officers"
                    min="1"
                  />
                </div>
              </div>

              <div className="alloc-form-row">
                <div className="alloc-form-field">
                  <label htmlFor="requestedBlock" className="alloc-label">Requested Block</label>
                  <select 
                    id="requestedBlock"
                    value={requestedBlock} 
                    onChange={(e) => setRequestedBlock(e.target.value)} 
                    required
                    className="alloc-input alloc-select"
                    disabled={loadingBlocks}
                  >
                    <option value="">
                      {loadingBlocks ? 'Loading blocks...' : 'Select Block'}
                    </option>
                    {blocks.map((blockName, index) => (
                      <option key={index} value={blockName}>
                        {blockName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="alloc-form-field">
                  <label htmlFor="officerFile" className="alloc-label">Upload Officer List</label>
                  <div className="alloc-file-wrapper">
                    <input 
                      id="officerFile"
                      type="file" 
                      accept=".pdf,.xlsx,.xls" 
                      onChange={(e) => setOfficerFile(e.target.files[0])}
                      className="alloc-file-input"
                    />
                    <div className="alloc-file-display">
                      {officerFile ? officerFile.name : 'Choose File'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="alloc-form-row">
                <div className="alloc-form-field">
                  <label htmlFor="fromDate" className="alloc-label">From Date</label>
                  <input 
                    id="fromDate"
                    type="date" 
                    value={fromDate} 
                    onChange={(e) => setFromDate(e.target.value)} 
                    required
                    className="alloc-input alloc-date"
                  />
                </div>
                
                <div className="alloc-form-field">
                  <label htmlFor="toDate" className="alloc-label">To Date</label>
                  <input 
                    id="toDate"
                    type="date" 
                    value={toDate} 
                    onChange={(e) => setToDate(e.target.value)} 
                    required
                    className="alloc-input alloc-date"
                  />
                </div>
              </div>

              <div className="alloc-form-row">
                <div className="alloc-form-field alloc-field-full">
                  <label htmlFor="notes" className="alloc-label">Remarks / Notes</label>
                  <textarea 
                    id="notes"
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    rows={4}
                    className="alloc-input alloc-textarea"
                    placeholder="Enter any additional remarks or notes..."
                  />
                </div>
              </div>
              
              <div className="alloc-modal-footer">
                <button type="button" onClick={() => setShowAllocForm(false)} className="alloc-btn alloc-btn-cancel">Cancel</button>
                <button type="submit" className="alloc-btn alloc-btn-submit">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;