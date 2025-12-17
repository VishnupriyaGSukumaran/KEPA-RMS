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
      {/* Sidebar - Same as AdminDashboard */}
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
            <button className="nav-item">
              <FaPlus /> Create Allocation Order
            </button>
            <button className="nav-item" onClick={() => navigate('/admin/display-block')}>
              <FaCubes /> Display Block Structure
            </button>
            <button className="nav-item">
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

      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </div>
  );
}

export default AdminReports;