// File: frontend/src/components/BlockHeadReports.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaDoorOpen,
  FaDoorClosed,
  FaList,
  FaBell,
  FaFileAlt,
  FaDownload,
  FaUsers,
  FaBed,
  FaCalendarAlt
} from 'react-icons/fa';
import './BlockheadReports.css';

const BlockHeadReports = () => {
  const pen = localStorage.getItem('pen');
  const blockNameFromStorage = localStorage.getItem('assignedBlock');
  const [userData, setUserData] = useState(null);
  const [blockName, setBlockName] = useState(blockNameFromStorage || '');
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Report data states
  const [activeReport, setActiveReport] = useState('summary');
  const [allocatedData, setAllocatedData] = useState([]);
  const [vacatedData, setVacatedData] = useState([]);
  const [bedAvailabilityData, setBedAvailabilityData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Date filter states
  const [allocatedFilterType, setAllocatedFilterType] = useState('all');
  const [allocatedDate, setAllocatedDate] = useState('');
  const [allocatedMonth, setAllocatedMonth] = useState('');
  const [allocatedYear, setAllocatedYear] = useState(new Date().getFullYear().toString());
  const [allocatedStartDate, setAllocatedStartDate] = useState('');
  const [allocatedEndDate, setAllocatedEndDate] = useState('');

  const [vacatedFilterType, setVacatedFilterType] = useState('all');
  const [vacatedDate, setVacatedDate] = useState('');
  const [vacatedMonth, setVacatedMonth] = useState('');
  const [vacatedYear, setVacatedYear] = useState(new Date().getFullYear().toString());
  const [vacatedStartDate, setVacatedStartDate] = useState('');
  const [vacatedEndDate, setVacatedEndDate] = useState('');

  useEffect(() => {
    if (!pen) return;

    fetch(`http://localhost:5000/api/auth/blockheadnew/${pen}`)
      .then(res => res.json())
      .then(user => {
        setUserData(user);
        const blockToFetch = (user.userType === 'blockhead' && user.assignedBlock) 
          ? user.assignedBlock 
          : blockNameFromStorage;
        if (blockToFetch) {
          setBlockName(blockToFetch);
          
          // Fetch unread notifications count
          fetch(`http://localhost:5000/api/allocations/block/${encodeURIComponent(blockToFetch)}`)
            .then(res => res.json())
            .then(notifications => {
              const unread = notifications.filter(n => !n.isRead).length;
              setUnreadCount(unread);
            })
            .catch(err => console.error('Error fetching notifications:', err));
        }
      })
      .catch(err => console.error('Error fetching user data:', err));
  }, [pen, blockNameFromStorage]);

  useEffect(() => {
    if (blockName) {
      fetchSummaryReport();
    }
  }, [blockName]);

  const fetchSummaryReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/blockheadReports/summary/${encodeURIComponent(blockName)}`);
      const data = await response.json();
      if (data.success) {
        setSummaryData(data.summary);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocatedReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/blockheadReports/allocated/${encodeURIComponent(blockName)}`);
      const data = await response.json();
      if (data.success) {
        setAllocatedData(data.data);
      }
    } catch (error) {
      console.error('Error fetching allocated report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVacatedReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/blockheadReports/vacated/${encodeURIComponent(blockName)}`);
      const data = await response.json();
      if (data.success) {
        setVacatedData(data.data);
      }
    } catch (error) {
      console.error('Error fetching vacated report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBedAvailabilityReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/blockheadReports/bed-availability/${encodeURIComponent(blockName)}`);
      const data = await response.json();
      if (data.success) {
        setBedAvailabilityData(data);
      }
    } catch (error) {
      console.error('Error fetching bed availability report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportChange = (reportType) => {
    setActiveReport(reportType);
    switch (reportType) {
      case 'allocated':
        fetchAllocatedReport();
        break;
      case 'vacated':
        fetchVacatedReport();
        break;
      case 'bedAvailability':
        fetchBedAvailabilityReport();
        break;
      case 'summary':
        fetchSummaryReport();
        break;
      default:
        break;
    }
  };

  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to download');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${blockName}_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const renderSummaryReport = () => (
    <div className="summary-report">
      <h3>Block Summary Report</h3>
      {summaryData && (
        <div className="summary-cards">
          <div className="summary-card blue">
            <FaList className="icon" />
            <div className="content">
              <h4>{summaryData.totalRooms}</h4>
              <p>Total Rooms</p>
            </div>
          </div>
          <div className="summary-card green">
            <FaBed className="icon" />
            <div className="content">
              <h4>{summaryData.totalBeds}</h4>
              <p>Total Beds</p>
            </div>
          </div>
          <div className="summary-card orange">
            <FaUsers className="icon" />
            <div className="content">
              <h4>{summaryData.currentlyAllocated}</h4>
              <p>Currently Allocated</p>
            </div>
          </div>
          <div className="summary-card red">
            <FaCalendarAlt className="icon" />
            <div className="content">
              <h4>{summaryData.totalVacated}</h4>
              <p>Total Vacated</p>
            </div>
          </div>
          <div className="summary-card purple">
            <FaBed className="icon" />
            <div className="content">
              <h4>{summaryData.bedsAllocated}</h4>
              <p>Beds Allocated</p>
            </div>
          </div>
          <div className="summary-card teal">
            <FaBed className="icon" />
            <div className="content">
              <h4>{summaryData.bedsVacant}</h4>
              <p>Beds Vacant</p>
            </div>
          </div>
          <div className="summary-card full-width">
            <div className="occupancy-bar">
              <h4>Occupancy Rate: {summaryData.occupancyRate}</h4>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: summaryData.occupancyRate }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAllocatedReport = () => (
    <div className="report-section">
      <div className="report-header">
        <h3>Currently Allocated Persons - {blockName}</h3>
        <button 
          className="download-btn"
          onClick={() => downloadCSV(allocatedData, 'allocated_persons')}
          disabled={allocatedData.length === 0}
        >
          <FaDownload /> Download CSV
        </button>
      </div>

      {/* Date Filter Section */}
      <div className="date-filter-section">
        <div className="filter-row">
          <label>Filter By:</label>
          <select 
            value={allocatedFilterType} 
            onChange={(e) => setAllocatedFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Records</option>
            <option value="date">Specific Date</option>
            <option value="month">Month Only</option>
            <option value="year">Year Only</option>
            <option value="monthYear">Month & Year</option>
            <option value="dateRange">Date Range</option>
          </select>

          {allocatedFilterType === 'date' && (
            <input
              type="date"
              value={allocatedDate}
              onChange={(e) => setAllocatedDate(e.target.value)}
              className="filter-input"
            />
          )}

          {allocatedFilterType === 'month' && (
            <>
              <select
                value={allocatedMonth}
                onChange={(e) => setAllocatedMonth(e.target.value)}
                className="filter-select"
              >
                <option value="">Select Month</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <input
                type="number"
                placeholder="Year"
                value={allocatedYear}
                onChange={(e) => setAllocatedYear(e.target.value)}
                className="filter-input"
                min="2000"
                max="2100"
              />
            </>
          )}

          {allocatedFilterType === 'year' && (
            <input
              type="number"
              placeholder="Year"
              value={allocatedYear}
              onChange={(e) => setAllocatedYear(e.target.value)}
              className="filter-input"
              min="2000"
              max="2100"
            />
          )}

          {allocatedFilterType === 'monthYear' && (
            <>
              <select
                value={allocatedMonth}
                onChange={(e) => setAllocatedMonth(e.target.value)}
                className="filter-select"
              >
                <option value="">Select Month</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <input
                type="number"
                placeholder="Year"
                value={allocatedYear}
                onChange={(e) => setAllocatedYear(e.target.value)}
                className="filter-input"
                min="2000"
                max="2100"
              />
            </>
          )}

          {allocatedFilterType === 'dateRange' && (
            <>
              <input
                type="date"
                value={allocatedStartDate}
                onChange={(e) => setAllocatedStartDate(e.target.value)}
                className="filter-input"
                placeholder="Start Date"
              />
              <span style={{ margin: '0 0.5rem' }}>to</span>
              <input
                type="date"
                value={allocatedEndDate}
                onChange={(e) => setAllocatedEndDate(e.target.value)}
                className="filter-input"
                placeholder="End Date"
              />
            </>
          )}

          <button 
            className="apply-filter-btn"
            onClick={fetchAllocatedReport}
          >
            Apply Filter
          </button>

          {allocatedFilterType !== 'all' && (
            <button 
              className="clear-filter-btn"
              onClick={() => {
                setAllocatedFilterType('all');
                setAllocatedDate('');
                setAllocatedMonth('');
                setAllocatedYear(new Date().getFullYear().toString());
                setAllocatedStartDate('');
                setAllocatedEndDate('');
                fetchAllocatedReport();
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {allocatedData.length === 0 ? (
        <p className="no-data">No allocated persons found</p>
      ) : (
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>PEN</th>
                <th>Recruitment No</th>
                <th>Designation</th>
                <th>Unit</th>
                <th>Room</th>
                <th>Bed</th>
                <th>Allocation Date</th>
                <th>Purpose</th>
                <th>Mobile</th>
              </tr>
            </thead>
            <tbody>
              {allocatedData.map((person, idx) => (
                <tr key={idx}>
                  <td>{person.name}</td>
                  <td>{person.pen}</td>
                  <td>{person.recruitmentNumber}</td>
                  <td>{person.designation}</td>
                  <td>{person.unit}</td>
                  <td>{person.roomNumber}</td>
                  <td>{person.bedIndex}</td>
                  <td>{person.allocationDate}</td>
                  <td>{person.purpose}</td>
                  <td>{person.mobileNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderVacatedReport = () => (
    <div className="report-section">
      <div className="report-header">
        <h3>Vacated Persons - {blockName}</h3>
        <button 
          className="download-btn"
          onClick={() => downloadCSV(vacatedData, 'vacated_persons')}
          disabled={vacatedData.length === 0}
        >
          <FaDownload /> Download CSV
        </button>
      </div>

      {/* Date Filter Section */}
      <div className="date-filter-section">
        <div className="filter-row">
          <label>Filter By:</label>
          <select 
            value={vacatedFilterType} 
            onChange={(e) => setVacatedFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Records</option>
            <option value="date">Specific Date</option>
            <option value="month">Month Only</option>
            <option value="year">Year Only</option>
            <option value="monthYear">Month & Year</option>
            <option value="dateRange">Date Range</option>
          </select>

          {vacatedFilterType === 'date' && (
            <input
              type="date"
              value={vacatedDate}
              onChange={(e) => setVacatedDate(e.target.value)}
              className="filter-input"
            />
          )}

          {vacatedFilterType === 'month' && (
            <>
              <select
                value={vacatedMonth}
                onChange={(e) => setVacatedMonth(e.target.value)}
                className="filter-select"
              >
                <option value="">Select Month</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <input
                type="number"
                placeholder="Year"
                value={vacatedYear}
                onChange={(e) => setVacatedYear(e.target.value)}
                className="filter-input"
                min="2000"
                max="2100"
              />
            </>
          )}

          {vacatedFilterType === 'year' && (
            <input
              type="number"
              placeholder="Year"
              value={vacatedYear}
              onChange={(e) => setVacatedYear(e.target.value)}
              className="filter-input"
              min="2000"
              max="2100"
            />
          )}

          {vacatedFilterType === 'monthYear' && (
            <>
              <select
                value={vacatedMonth}
                onChange={(e) => setVacatedMonth(e.target.value)}
                className="filter-select"
              >
                <option value="">Select Month</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <input
                type="number"
                placeholder="Year"
                value={vacatedYear}
                onChange={(e) => setVacatedYear(e.target.value)}
                className="filter-input"
                min="2000"
                max="2100"
              />
            </>
          )}

          {vacatedFilterType === 'dateRange' && (
            <>
              <input
                type="date"
                value={vacatedStartDate}
                onChange={(e) => setVacatedStartDate(e.target.value)}
                className="filter-input"
                placeholder="Start Date"
              />
              <span style={{ margin: '0 0.5rem' }}>to</span>
              <input
                type="date"
                value={vacatedEndDate}
                onChange={(e) => setVacatedEndDate(e.target.value)}
                className="filter-input"
                placeholder="End Date"
              />
            </>
          )}

          <button 
            className="apply-filter-btn"
            onClick={fetchVacatedReport}
          >
            Apply Filter
          </button>

          {vacatedFilterType !== 'all' && (
            <button 
              className="clear-filter-btn"
              onClick={() => {
                setVacatedFilterType('all');
                setVacatedDate('');
                setVacatedMonth('');
                setVacatedYear(new Date().getFullYear().toString());
                setVacatedStartDate('');
                setVacatedEndDate('');
                fetchVacatedReport();
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
      
      {vacatedData.length === 0 ? (
        <p className="no-data">No vacated persons found</p>
      ) : (
        <div className="table-container">
          <table className="report-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>PEN</th>
                <th>Room</th>
                <th>Bed</th>
                <th>Allocation Date</th>
                <th>Vacating Date</th>
                <th>Days Stayed</th>
                <th>Purpose</th>
                <th>Paid</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {vacatedData.map((person, idx) => (
                <tr key={idx}>
                  <td>{person.name}</td>
                  <td>{person.pen}</td>
                  <td>{person.roomNumber}</td>
                  <td>{person.bedIndex}</td>
                  <td>{person.allocationDate}</td>
                  <td>{person.vacatingDate}</td>
                  <td>{person.daysStayed}</td>
                  <td>{person.purpose}</td>
                  <td>{person.paid}</td>
                  <td>{person.paymentAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderBedAvailabilityReport = () => (
    <div className="report-section">
      <div className="report-header">
        <h3>Bed Availability - {blockName}</h3>
      </div>
      
      {bedAvailabilityData && (
        <>
          <div className="availability-summary">
            <div className="stat-box">
              <h4>{bedAvailabilityData.summary.totalRooms}</h4>
              <p>Total Rooms</p>
            </div>
            <div className="stat-box">
              <h4>{bedAvailabilityData.summary.totalBeds}</h4>
              <p>Total Beds</p>
            </div>
            <div className="stat-box green">
              <h4>{bedAvailabilityData.summary.totalVacant}</h4>
              <p>Vacant Beds</p>
            </div>
            <div className="stat-box red">
              <h4>{bedAvailabilityData.summary.totalAllocated}</h4>
              <p>Allocated Beds</p>
            </div>
            <div className="stat-box purple">
              <h4>{bedAvailabilityData.summary.occupancyRate}</h4>
              <p>Occupancy Rate</p>
            </div>
          </div>

          {bedAvailabilityData.roomTypeBreakdown.map((roomType, idx) => (
            <div key={idx} className="room-type-section">
              <h4>{roomType.roomType} Details</h4>
              <div className="room-type-stats">
                <span>Rooms: {roomType.totalRooms}</span>
                <span>Total Beds: {roomType.totalBeds}</span>
                <span>Allocated: {roomType.allocatedBeds}</span>
                <span>Vacant: {roomType.vacantBeds}</span>
                <span>Fully Occupied: {roomType.fullyOccupied}</span>
                <span>Partially Occupied: {roomType.partiallyOccupied}</span>
                <span>Vacant Rooms: {roomType.vacant}</span>
              </div>
              
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Room Name</th>
                      <th>Floor</th>
                      <th>Total Beds</th>
                      <th>Allocated</th>
                      <th>Vacant</th>
                      <th>Status</th>
                      <th>AC</th>
                      <th>Bathroom</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomType.rooms.map((room, roomIdx) => (
                      <tr key={roomIdx}>
                        <td>{room.roomName}</td>
                        <td>{room.floorNumber}</td>
                        <td>{room.totalBeds}</td>
                        <td>{room.allocatedBeds}</td>
                        <td>{room.vacantBeds}</td>
                        <td>
                          <span className={`status-badge ${room.status.toLowerCase().replace(' ', '-')}`}>
                            {room.status}
                          </span>
                        </td>
                        <td>{room.isAC ? '✓' : '✗'}</td>
                        <td>{room.attachedBathroom ? '✓' : '✗'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );

  return (
    <div className="dashboard-containerr">
      <aside className="sidebarr">
        <div className="profile">
          <h3>{userData ? `Insp. ${userData.firstName} ${userData.lastName}` : 'Loading...'}</h3>
          <p>Block Head - {blockName || ''}</p>
        </div>
        <nav className="menu">
          <Link to={`/blockhead/dashboard/${blockName}`}><FaTachometerAlt /> Dashboard</Link>
          <Link to="/blockhead/AllocateRoom"><FaDoorOpen /> Allocate Room</Link>
          <Link to="/blockhead/VacateRoom"><FaDoorClosed /> Vacate Room</Link>
          <Link to={`/blockhead/ViewBlock/${blockName}`}><FaList /> Display Block</Link>
          <Link to="/blockhead/notifications" style={{ position: 'relative' }}>
            <FaBell /> Notifications
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </Link>
          <Link to="/blockhead/reports" className="active"><FaFileAlt /> Reports</Link>
        </nav>
      </aside>
      
      <main className="main-contentt">
        <h3>BLOCK REPORTS - {blockName?.toUpperCase() || ''}</h3>
        
        <div className="report-tabs">
          <button 
            className={activeReport === 'summary' ? 'active' : ''}
            onClick={() => handleReportChange('summary')}
          >
            Summary
          </button>
          <button 
            className={activeReport === 'allocated' ? 'active' : ''}
            onClick={() => handleReportChange('allocated')}
          >
            Allocated Persons
          </button>
          <button 
            className={activeReport === 'vacated' ? 'active' : ''}
            onClick={() => handleReportChange('vacated')}
          >
            Vacated Persons
          </button>
          <button 
            className={activeReport === 'bedAvailability' ? 'active' : ''}
            onClick={() => handleReportChange('bedAvailability')}
          >
            Bed Availability
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading report...</p>
          </div>
        ) : (
          <div className="report-content">
            {activeReport === 'summary' && renderSummaryReport()}
            {activeReport === 'allocated' && renderAllocatedReport()}
            {activeReport === 'vacated' && renderVacatedReport()}
            {activeReport === 'bedAvailability' && renderBedAvailabilityReport()}
          </div>
        )}
      </main>
    </div>
  );
};

export default BlockHeadReports;