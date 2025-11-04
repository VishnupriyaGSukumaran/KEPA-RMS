import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


import './GenerateReport.css';

const GenerateReport = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState([]);
  
  // Enhanced Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState('');
  const [dateFilterType, setDateFilterType] = useState('range');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/block');
      setBlocks(response.data);
    } catch (error) {
      console.error('Error fetching blocks:', error);
    }
  };

  const reportTypes = [
    { 
      id: 'allocation', 
      title: 'Allocation Report', 
      desc: 'View room allocations with advanced date filters',
      icon: '📋'
    },
    { 
      id: 'vacancy', 
      title: 'Vacancy Report', 
      desc: 'Check room vacancy with historical analysis',
      icon: '🛏️'
    },
    { 
      id: 'course', 
      title: 'Course Report', 
      desc: 'All training courses information',
      icon: '📚'
    },
    { 
      id: 'block', 
      title: 'Block Report', 
      desc: 'Complete block structure and details',
      icon: '🏢'
    },
    { 
      id: 'admin', 
      title: 'Admin Report', 
      desc: 'Administrator and super admin details',
      icon: '👨‍💼'
    },
    { 
      id: 'blockhead', 
      title: 'Block Head Report', 
      desc: 'Block head assignments and details',
      icon: '👨‍🏫'
    },
    { 
      id: 'system', 
      title: 'System Report', 
      desc: 'Completeness, actions, proof, output of reliability',
      icon: '📊'
    }
  ];

        const handleGenerateReport = async () => {
  if (!reportType) {
    alert('Please select a report type');
    return;
  }

  setLoading(true);
  try {
    const payload = {
      generatedBy: 'Admin',
      startDate,
      endDate,
      month: selectedMonth,
      year: selectedYear,
      years: selectedYears,
      blockName: selectedBlock,
      purpose: selectedPurpose
    };

    // Clean up payload - remove empty values
    Object.keys(payload).forEach(key => {
      if (payload[key] === '' || (Array.isArray(payload[key]) && payload[key].length === 0)) {
        delete payload[key];
      }
    });

    console.log('Sending payload:', payload);
    console.log('Report type:', reportType);
    console.log('Endpoint URL:', `http://localhost:5000/api/reports/${reportType}`);

    // ✅ FIXED: Use reportType directly - no mapping needed
    const response = await axios.post(
      `http://localhost:5000/api/reports/${reportType}`, 
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Response received:', response.data);
    
    if (response.data && response.data.success) {
      setReportData(response.data);
      console.log('Report data set successfully');
    } else {
      throw new Error('Invalid response format from server');
    }

  } catch (error) {
    console.error('Error generating report:', error);
    
    // Better error message
    let errorMessage = 'Failed to generate report';
    if (error.response) {
      errorMessage += `: ${error.response.data?.error || error.response.statusText}`;
      console.error('Server response:', error.response.data);
      console.error('Status code:', error.response.status);
    } else if (error.request) {
      errorMessage += ': No response from server. Check if backend is running.';
      console.error('No response received:', error.request);
    } else {
      errorMessage += `: ${error.message}`;
    }
    
    alert(errorMessage);
  } finally {
    setLoading(false);
  }
};

  const handleYearSelection = (year) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        return prev.filter(y => y !== year);
      } else {
        return [...prev, year];
      }
    });
  };

  const handleExportPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(0, 0, 128);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('KERALA POLICE ACADEMY', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('ROOM MANAGEMENT SYSTEM', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(reportData.report?.reportTitle || 'Report', pageWidth / 2, 35, { align: 'center' });

    // Report details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 50);
    doc.text(`Generated by: Admin`, 14, 57);
    doc.text(`Date Range: ${reportData.report?.summary?.dateRange || 'All Time'}`, 14, 64);

    let yPos = 75;

    // Enhanced Summary section
    if (reportData.report?.summary) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 128);
      doc.text('EXECUTIVE SUMMARY', 14, yPos);
      yPos += 10;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      const summary = reportData.report.summary;
      const mainStats = [
        ['Total Records', summary.totalRecords || summary.totalAllocations],
        ['Total Beds', summary.totalBeds],
        ['Allocated Beds', summary.allocatedBeds],
        ['Vacant Beds', summary.vacantBeds],
        ['Occupancy Rate', summary.occupancyRate]
      ].filter(stat => stat[1] !== undefined);

      // Main statistics
      mainStats.forEach(([label, value], index) => {
        if (index % 2 === 0) {
          doc.text(`${label}: ${value}`, 14, yPos);
        } else {
          doc.text(`${label}: ${value}`, pageWidth / 2 + 10, yPos);
          yPos += 6;
        }
      });
      if (mainStats.length % 2 !== 0) yPos += 6;
      
      yPos += 10;
    }

    // Data tables
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 128);
    doc.text('DETAILED DATA', 14, yPos);
    yPos += 15;

    // Table rendering
    if (reportData.data && reportData.data.length > 0) {
      let tableData = [];
      let headers = [];

      switch (reportType) {
        case 'allocation':
          headers = ['Name', 'PEN/Recruit No', 'Block', 'Room', 'Purpose', 'Designation', 'Date'];
          tableData = reportData.data.map(item => [
            item.name || '-',
            item.pen || item.recruitmentNumber || '-',
            item.block || '-',
            item.roomNumber || '-',
            item.purpose || '-',
            item.designation || '-',
            item.allocationDate ? new Date(item.allocationDate).toLocaleDateString('en-IN') : '-'
          ]);
          break;
        case 'vacancy':
          headers = ['Block', 'Room', 'Type', 'Total', 'Allocated', 'Vacant', 'Status'];
          tableData = reportData.data.map(item => [
            item.blockName || '-',
            item.roomName || '-',
            item.roomType || '-',
            item.totalBeds || '0',
            item.allocatedBeds || '0',
            item.currentVacantBeds || '0',
            item.status || '-'
          ]);
          break;
        case 'system':
          headers = ['Metric', 'Value', 'Status'];
          tableData = Object.entries(reportData.report?.summary || {}).map(([key, value]) => [
            key.replace(/([A-Z])/g, ' $1').replace(/\b\w/g, l => l.toUpperCase()),
            value,
            'Completed'
          ]);
          break;
        default:
          headers = Object.keys(reportData.data[0] || {});
          tableData = reportData.data.map(item => 
            headers.map(header => item[header] || '-')
          );
      }

      autoTable(doc, {
  startY: yPos,
  head: [headers],
  body: tableData,
  theme: 'grid',
  headStyles: { 
    fillColor: [0, 0, 128],
    textColor: 255,
    fontStyle: 'bold'
  },
  styles: { fontSize: 8 },
  margin: { top: 10 }
});

    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`${reportType}_report_${Date.now()}.pdf`);
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.data) return;

    let csvContent = '';
    let headers = [];
    let rows = [];

    switch (reportType) {
      case 'allocation':
        headers = ['Name', 'PEN/Recruit No', 'Block', 'Room', 'Purpose', 'Designation', 'Unit', 'Allocation Date'];
        rows = reportData.data.map(item => [
          item.name,
          item.pen || item.recruitmentNumber || '-',
          item.block,
          item.roomNumber,
          item.purpose,
          item.designation,
          item.unit || '-',
          item.allocationDate ? new Date(item.allocationDate).toLocaleDateString('en-IN') : '-'
        ]);
        break;
      
      case 'vacancy':
        headers = ['Block', 'Room', 'Type', 'Total Beds', 'Allocated', 'Current Vacant', 'Historical Allocations', 'Last Allocation', 'Status'];
        rows = reportData.data.map(item => [
          item.blockName,
          item.roomName,
          item.roomType,
          item.totalBeds,
          item.allocatedBeds,
          item.currentVacantBeds,
          item.historicalAllocations,
          item.lastAllocation ? new Date(item.lastAllocation).toLocaleDateString('en-IN') : 'Never',
          item.status
        ]);
        break;
      
      case 'system':
        headers = ['Metric', 'Value', 'Status'];
        rows = Object.entries(reportData.report?.summary || {}).map(([key, value]) => [
          key.replace(/([A-Z])/g, ' $1').replace(/\b\w/g, l => l.toUpperCase()),
          value,
          'Completed'
        ]);
        break;
      
      default:
        if (reportData.data.length > 0) {
          headers = Object.keys(reportData.data[0]);
          rows = reportData.data.map(item => 
            headers.map(header => item[header] || '')
          );
        }
        break;
    }

    if (headers.length > 0) {
      csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.map(field => `"${field}"`).join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportType}_report_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('report-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${reportData?.report?.reportTitle || 'Report'}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .print-header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 3px solid #000080;
              padding-bottom: 20px;
            }
            .print-header h1 { 
              color: #000080; 
              margin: 0; 
              font-size: 24px;
            }
            .print-header h2 { 
              color: #333; 
              margin: 10px 0; 
              font-size: 18px;
            }
            .print-header .report-info {
              color: #666;
              font-size: 14px;
              margin-top: 10px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0; 
              font-size: 12px;
            }
            th { 
              background: #000080; 
              color: white; 
              padding: 12px; 
              text-align: left; 
              font-weight: bold;
            }
            td { 
              padding: 10px; 
              border-bottom: 1px solid #ddd; 
            }
            tr:nth-child(even) { 
              background: #f9f9f9; 
            }
            @media print { 
              body { margin: 0.5in; }
              table { font-size: 10px; }
            }
            @page {
              margin: 0.5in;
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>KERALA POLICE ACADEMY</h1>
            <h2>ROOM MANAGEMENT SYSTEM</h2>
            <h3>${reportData?.report?.reportTitle || 'Report'}</h3>
            <div class="report-info">
              Generated on: ${new Date().toLocaleDateString('en-IN')} | 
              Generated by: Admin |
              Date Range: ${reportData?.report?.summary?.dateRange || 'All Time'}
            </div>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const renderDateFilters = () => {
    return (
      <div className="date-filter-section">
        <div className="filter-type-selector">
          <label>Date Filter Type:</label>
          <select 
            value={dateFilterType} 
            onChange={(e) => setDateFilterType(e.target.value)}
            className="filter-type-dropdown"
          >
            <option value="range">Date Range</option>
            <option value="monthYear">Month & Year</option>
            <option value="multipleYears">Multiple Years</option>
          </select>
        </div>

        {dateFilterType === 'range' && (
          <div className="filter-row">
            <div className="filter-group">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {dateFilterType === 'monthYear' && (
          <div className="filter-row">
            <div className="filter-group">
              <label>Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">Select Month</option>
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">Select Year</option>
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {dateFilterType === 'multipleYears' && (
          <div className="filter-group">
            <label>Select Years</label>
            <div className="years-checkbox-grid">
              {years.map(year => (
                <label key={year} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedYears.includes(year)}
                    onChange={() => handleYearSelection(year)}
                  />
                  <span>{year}</span>
                </label>
              ))}
            </div>
            {selectedYears.length > 0 && (
              <div className="selected-years">
                Selected Years: {selectedYears.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderEnhancedSummary = () => {
    if (!reportData?.report?.summary) return null;

    const summary = reportData.report.summary;

    return (
      <div className="enhanced-summary">
        <div className="summary-cards">
          {Object.entries(summary).map(([key, value]) => {
            if (typeof value === 'object' || Array.isArray(value)) return null;
            
            const formattedKey = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/\b\w/g, l => l.toUpperCase())
              .trim();
            
            return (
              <div key={key} className="summary-card">
                <h4>{formattedKey}</h4>
                <p className="value">{value}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderReportTable = () => {
    if (!reportData?.data || reportData.data.length === 0) return null;

    switch (reportType) {
      case 'allocation':
        return (
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>PEN/Recruit No</th>
                  <th>Block</th>
                  <th>Room</th>
                  <th>Purpose</th>
                  <th>Designation</th>
                  <th>Unit</th>
                  <th>Allocation Date</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>{item.pen || item.recruitmentNumber || '-'}</td>
                    <td>{item.block}</td>
                    <td>{item.roomNumber}</td>
                    <td>{item.purpose}</td>
                    <td>{item.designation}</td>
                    <td>{item.unit || '-'}</td>
                    <td>{item.allocationDate ? new Date(item.allocationDate).toLocaleDateString('en-IN') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'vacancy':
        return (
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Block</th>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Total Beds</th>
                  <th>Allocated</th>
                  <th>Current Vacant</th>
                  <th>Historical Allocations</th>
                  <th>Last Allocation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.data.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.blockName}</td>
                    <td>{item.roomName}</td>
                    <td>{item.roomType}</td>
                    <td>{item.totalBeds}</td>
                    <td>{item.allocatedBeds}</td>
                    <td>{item.currentVacantBeds}</td>
                    <td>{item.historicalAllocations}</td>
                    <td>
                      {item.lastAllocation ? 
                        new Date(item.lastAllocation).toLocaleDateString('en-IN') : 
                        'Never'
                      }
                    </td>
                    <td>
                      <span className={`status-badge ${
                        item.status === 'Vacant' ? 'status-vacant' :
                        item.status === 'Full' ? 'status-allocated' : 'status-partial'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'system':
        return (
          <div className="table-container">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(reportData.report?.summary || {}).map(([key, value], idx) => (
                  <tr key={idx}>
                    <td>{key.replace(/([A-Z])/g, ' $1').replace(/\b\w/g, l => l.toUpperCase())}</td>
                    <td>{value}</td>
                    <td>
                      <span className="status-badge status-completed">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        if (reportData.data.length > 0) {
          const headers = Object.keys(reportData.data[0]);
          return (
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    {headers.map(header => (
                      <th key={header}>
                        {header.replace(/([A-Z])/g, ' $1').replace(/\b\w/g, l => l.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.data.map((item, idx) => (
                    <tr key={idx}>
                      {headers.map(header => (
                        <td key={header}>{item[header] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return null;
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedYears([]);
    setSelectedBlock('');
    setSelectedPurpose('');
    setDateFilterType('range');
  };

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className="report-container">
      <header className="report-header">
        
        <div className="report-header-center">
          <h2>Generate Report</h2>
        </div>
        <div className="report-header-right">
          <button onClick={() => navigate('/superadmin/dashboard')} className="header-btn">
            Back
          </button>
          <button className="header-btn" onClick={handleHome}>🏠 Home</button>
        </div>
      </header>

      <main className="report-main">
        <section className="report-section">
          <h2 className="section-title">Select Report Type</h2>
          <div className="report-cards">
            {reportTypes.map(type => (
              <div
                key={type.id}
                className={`report-card ${reportType === type.id ? 'selected' : ''}`}
                onClick={() => setReportType(type.id)}
              >
                <div className="card-icon">{type.icon}</div>
                <h3>{type.title}</h3>
                <p>{type.desc}</p>
                {reportType === type.id && (
                  <div className="selected-indicator">✓ Selected</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {reportType && (
          <section className="report-section">
            <h2 className="section-title">Filter Options</h2>
            <div className="filter-section">
              
              {/* Date Filters */}
              {(reportType === 'allocation' || reportType === 'vacancy' || reportType === 'course' || reportType === 'system') && (
                renderDateFilters()
              )}

              <div className="filter-grid">
                {/* Block Filter */}
                {['allocation', 'vacancy', 'block'].includes(reportType) && (
                  <div className="filter-group">
                    <label>Block</label>
                    <select
                      value={selectedBlock}
                      onChange={(e) => setSelectedBlock(e.target.value)}
                    >
                      <option value="">All Blocks</option>
                      {blocks.map(block => (
                        <option key={block._id} value={block.blockName}>
                          {block.blockName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Purpose Filter */}
                {reportType === 'allocation' && (
                  <div className="filter-group">
                    <label>Purpose</label>
                    <select
                      value={selectedPurpose}
                      onChange={(e) => setSelectedPurpose(e.target.value)}
                    >
                      <option value="">All Purposes</option>
                      <option value="Basic Training">Basic Training</option>
                      <option value="Inservice Training">Inservice Training</option>
                      <option value="Faculty/Guest">Faculty/Guest</option>
                      <option value="KEPA Officers">KEPA Officers</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="filter-buttons">
                <button className="btn btn-secondary" onClick={clearFilters}>
                  🗑️ Clear Filters
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleGenerateReport}
                  disabled={loading}
                >
                  {loading ? '⏳ Generating...' : '📊 Generate Report'}
                </button>
              </div>
            </div>
          </section>
        )}

        {loading && (
          <section className="report-section">
            <div className="loading">
              <div className="spinner"></div>
              <h3>Generating Report...</h3>
              <p>Please wait while we process your request.</p>
            </div>
          </section>
        )}

        {reportData && !loading && (
          <section className="report-section">
            <div id="report-content">
              <h2 className="section-title">{reportData.report?.reportTitle || 'Generated Report'}</h2>
              
              {renderEnhancedSummary()}

              <div className="report-display">
                {renderReportTable()}
              </div>
            </div>

            <div className="export-buttons">
              <button className="btn btn-success" onClick={handleExportPDF}>
                📄 Export PDF
              </button>
              <button className="btn btn-success" onClick={handleExportCSV}>
                📊 Export CSV
              </button>
              <button className="btn btn-primary" onClick={handlePrint}>
                🖨️ Print Report
              </button>
            </div>
          </section>
        )}

        {reportData && reportData.data && reportData.data.length === 0 && (
          <section className="report-section">
            <div className="no-data">
              <h3>📭 No Data Found</h3>
              <p>No records match your selected filters. Try adjusting your filter criteria.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default GenerateReport;