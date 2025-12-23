// AdminReports.js - FIXED: Full Modal Functionality
import React, { useState, useEffect } from 'react';
import './AdminReports.css';
import {
  FaTh,
  FaUsers,
  FaBell,
  FaChartBar,
  FaCubes,
  FaBook,
  FaPlus,
  FaFileDownload,
  FaFilter
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminReports() {
  const navigate = useNavigate();
  
  // State Management
  const [activeReport, setActiveReport] = useState('allocated');
  const [blocks, setBlocks] = useState([]);
  const [blockHeads, setBlockHeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  // ✅ Modal states for allocation and course order
  const [showAllocForm, setShowAllocForm] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  // ✅ Allocation form states
  const [purpose, setPurpose] = useState('');
  const [officerCount, setOfficerCount] = useState('');
  const [requestedBlock, setRequestedBlock] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [notes, setNotes] = useState('');
  const [officerFile, setOfficerFile] = useState(null);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  // ✅ Course form states
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseFile, setCourseFile] = useState(null);

  // Admin User Details State
  const [adminUser, setAdminUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: ''
  });

  // Filter States
  const [filters, setFilters] = useState({
    dateType: 'all',
    specificDate: '',
    month: '',
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    blockFilter: 'all',
    selectedBlock: ''
  });

  // Fetch admin details
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

  // Fetch blocks and blockheads on mount
  useEffect(() => {
    fetchBlocks();
    fetchBlockHeads();
  }, []);

  // ✅ Fetch blocks when allocation form opens
  useEffect(() => {
    const fetchBlocksForAllocation = async () => {
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

    fetchBlocksForAllocation();
  }, [showAllocForm]);

  const fetchBlocks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/block');
      if (Array.isArray(response.data)) {
        setBlocks(response.data.map(b => b.blockName).filter(Boolean));
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
      toast.error('Failed to load blocks');
    }
  };

  const fetchBlockHeads = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/blockheads');
      setBlockHeads(response.data);
    } catch (error) {
      console.error('Failed to fetch blockheads:', error);
      toast.error('Failed to load block heads');
    }
  };

  // ✅ Allocation form submit handler
  const handleAllocSubmit = async (e) => {
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
      toast.success('Allocation order sent successfully!');
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
      toast.error('Failed to send allocation.');
    }
  };

  // ✅ Course form submit handler
  const handleCourseSubmit = async (e) => {
    e.preventDefault();

    if (!courseTitle || !courseDesc) {
      toast.warning('Please enter both title and description.');
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

      toast.success('Course order sent to SuperAdmin.');
      setCourseTitle('');
      setCourseDesc('');
      setCourseFile(null);
      setShowCourseModal(false);
    } catch (error) {
      console.error('Error submitting course order:', error);
      toast.error('Failed to send course order.');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'blockFilter' && value === 'all' ? { selectedBlock: '' } : {})
    }));
  };

  const generateReport = async () => {
    if (filters.blockFilter === 'individual' && !filters.selectedBlock) {
      toast.warning('Please select a block');
      return;
    }

    setLoading(true);
    try {
      let endpoint = '';
      const params = new URLSearchParams();

      if (filters.blockFilter === 'individual' && filters.selectedBlock) {
        params.append('block', filters.selectedBlock);
      }

      if (filters.dateType === 'date' && filters.specificDate) {
        params.append('date', filters.specificDate);
      } else if (filters.dateType === 'month' && filters.month) {
        params.append('month', filters.month);
      } else if (filters.dateType === 'year' && filters.year) {
        params.append('year', filters.year);
      } else if (filters.dateType === 'monthYear' && filters.month && filters.year) {
        params.append('month', filters.month);
        params.append('year', filters.year);
      } else if (filters.dateType === 'dateRange' && filters.startDate && filters.endDate) {
        params.append('startDate', filters.startDate);
        params.append('endDate', filters.endDate);
      }

      switch (activeReport) {
        case 'allocated':
          endpoint = 'http://localhost:5000/api/adminReports/allocated';
          break;
        case 'vacated':
          endpoint = 'http://localhost:5000/api/adminReports/vacated';
          break;
        case 'availability':
          endpoint = 'http://localhost:5000/api/adminReports/availability';
          break;
        case 'blockhead':
          endpoint = 'http://localhost:5000/api/adminReports/blockhead-detail';
          break;
        case 'block':
          endpoint = 'http://localhost:5000/api/adminReports/block-detail';
          break;
        default:
          endpoint = 'http://localhost:5000/api/adminReports/allocated';
      }

      const response = await axios.get(`${endpoint}?${params.toString()}`);
      
      if (response.data.success) {
        setReportData(response.data.data);
        toast.success('Report generated successfully');
      } else {
        toast.error(response.data.message || 'Failed to generate report');
        setReportData([]);
      }
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate report');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData || reportData.length === 0) {
      toast.warning('No data to download');
      return;
    }

    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report downloaded successfully');
  };

  const renderFilterOptions = () => {
    const showDateFilters = ['allocated', 'vacated', 'availability'].includes(activeReport);
    
    return (
      <div className="filter-section">
        <h3><FaFilter /> Filters</h3>
        
        <div className="filter-group">
          <label>Block Selection:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="blockFilter"
                value="all"
                checked={filters.blockFilter === 'all'}
                onChange={(e) => handleFilterChange('blockFilter', e.target.value)}
              />
              All Blocks
            </label>
            <label>
              <input
                type="radio"
                name="blockFilter"
                value="individual"
                checked={filters.blockFilter === 'individual'}
                onChange={(e) => handleFilterChange('blockFilter', e.target.value)}
              />
              Individual Block
            </label>
          </div>
          
          {filters.blockFilter === 'individual' && (
            <select
              value={filters.selectedBlock}
              onChange={(e) => handleFilterChange('selectedBlock', e.target.value)}
              className="filter-select"
            >
              <option value="">Select Block</option>
              {blocks.map((block, idx) => (
                <option key={idx} value={block}>{block}</option>
              ))}
            </select>
          )}
        </div>

        {showDateFilters && (
          <div className="filter-group">
            <label>Date Filter:</label>
            <select
              value={filters.dateType}
              onChange={(e) => handleFilterChange('dateType', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Time</option>
              <option value="date">Specific Date</option>
              <option value="month">Specific Month</option>
              <option value="year">Specific Year</option>
              <option value="monthYear">Month & Year</option>
              {activeReport === 'vacated' && <option value="dateRange">Date Range</option>}
            </select>

            {filters.dateType === 'date' && (
              <input
                type="date"
                value={filters.specificDate}
                onChange={(e) => handleFilterChange('specificDate', e.target.value)}
                className="filter-input"
              />
            )}

            {(filters.dateType === 'month' || filters.dateType === 'monthYear') && (
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="filter-select"
              >
                <option value="">Select Month</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            )}

            {(filters.dateType === 'year' || filters.dateType === 'monthYear') && (
              <input
                type="number"
                placeholder="Year"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="filter-input"
                min="2000"
                max="2100"
              />
            )}

            {filters.dateType === 'dateRange' && (
              <>
                <input
                  type="date"
                  placeholder="Start Date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="filter-input"
                />
                <input
                  type="date"
                  placeholder="End Date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="filter-input"
                />
              </>
            )}
          </div>
        )}

        <div className="filter-actions">
          <button onClick={generateReport} disabled={loading} className="btn-generate">
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          {reportData.length > 0 && (
            <button onClick={downloadReport} className="btn-download">
              <FaFileDownload /> Download CSV
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderReportTable = () => {
    if (!reportData || reportData.length === 0) {
      return (
        <div className="no-data">
          <FaChartBar size={50} />
          <p>No data available. Please generate a report.</p>
        </div>
      );
    }

    const headers = Object.keys(reportData[0]);

    return (
      <div className="report-table-container">
        <table className="report-table">
          <thead>
            <tr>
              {headers.map((header, idx) => (
                <th key={idx}>{header.replace(/_/g, ' ').toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {headers.map((header, colIdx) => (
                  <td key={colIdx}>
                    {row[header] !== null && row[header] !== undefined 
                      ? String(row[header]) 
                      : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="admin-reports-container">
      {/* Sidebar */}
      <div className="reports-sidebar">
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
            <button className="nav-item" onClick={() => navigate('/admin/dashboard')}>
              <FaTh /> Dashboard
            </button>
            <div className="nav-heading">MANAGEMENT</div>
            <button className="nav-item" onClick={() => navigate('/admin/blockheads')}>
              <FaUsers /> Assign Block Heads
            </button>
            <button className="nav-item" onClick={() => setShowAllocForm(true)}>
              <FaPlus /> Create Allocation Order
            </button>
            <button className="nav-item" onClick={() => navigate('/admin/display-block')}>
              <FaCubes /> Display Block Structure
            </button>
            <button className="nav-item" onClick={() => setShowCourseModal(true)}>
              <FaBook /> Forward Course Order
            </button>
            <button className="nav-item active">
              <FaChartBar /> Generate Reports
            </button>
            <button className="nav-item">
              <FaBell /> Notifications
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="admin-reports-wrapper">
        {/* Header */}
        <div className="reports-header">
          <button className="back-btn-reports" onClick={() => navigate('/admin/dashboard')}>
            ← Back
          </button>
          <h1>Admin Reports</h1>
        </div>

        {/* Report Type Selection */}
        <div className="report-types">
          <button
            className={`report-type-btn ${activeReport === 'allocated' ? 'active' : ''}`}
            onClick={() => setActiveReport('allocated')}
          >
            Allocated Persons
          </button>
          <button
            className={`report-type-btn ${activeReport === 'vacated' ? 'active' : ''}`}
            onClick={() => setActiveReport('vacated')}
          >
            Vacated Persons
          </button>
          <button
            className={`report-type-btn ${activeReport === 'availability' ? 'active' : ''}`}
            onClick={() => setActiveReport('availability')}
          >
            Bed Availability
          </button>
          <button
            className={`report-type-btn ${activeReport === 'blockhead' ? 'active' : ''}`}
            onClick={() => setActiveReport('blockhead')}
          >
            Block Head Details
          </button>
          <button
            className={`report-type-btn ${activeReport === 'block' ? 'active' : ''}`}
            onClick={() => setActiveReport('block')}
          >
            Block Details
          </button>
        </div>

        {/* Filters */}
        {renderFilterOptions()}

        {/* Report Display */}
        <div className="report-display">
          <h2>{activeReport.replace(/([A-Z])/g, ' $1').trim().toUpperCase()} REPORT</h2>
          {renderReportTable()}
        </div>
      </div>

      {/* ✅ ALLOCATION MODAL - Full functionality from AdminDashboard */}
      {showAllocForm && (
        <div className="alloc-modal-backdrop">
          <div className="alloc-modal-container">
            <div className="alloc-modal-header">
              <h2 className="alloc-modal-title">Allocation Order</h2>
            </div>
            <form onSubmit={handleAllocSubmit} className="alloc-modal-body">
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
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAllocForm(false);
                    setPurpose('');
                    setOfficerCount('');
                    setRequestedBlock('');
                    setFromDate('');
                    setToDate('');
                    setNotes('');
                    setOfficerFile(null);
                    navigate('/admin/dashboard');
                  }} 
                  className="alloc-btn alloc-btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="alloc-btn alloc-btn-submit">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ COURSE MODAL - Full functionality from AdminDashboard */}
      {showCourseModal && (
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
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCourseModal(false);
                    setCourseTitle('');
                    setCourseDesc('');
                    setCourseFile(null);
                    navigate('/admin/dashboard');
                  }}
                >
                  Cancel
                </button>
                <button type="submit">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </div>
  );
}

export default AdminReports;