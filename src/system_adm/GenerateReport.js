import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import './GenerateReport.css';

const GenerateReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [dateFilterType, setDateFilterType] = useState('');

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
    
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    if (type) {
      setReportType(type);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

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
      desc: 'View room allocations with date filters',
      color: '#3b82f6'
    },
    { 
      id: 'vacancy', 
      title: 'Vacancy Report', 
      desc: 'Check room vacancy status',
      color: '#10b981'
    },
    { 
      id: 'course', 
      title: 'Course Report', 
      desc: 'Training courses information',
      color: '#f59e0b'
    },
    { 
      id: 'block', 
      title: 'Block Report', 
      desc: 'Block structure and details',
      color: '#8b5cf6'
    },
    { 
      id: 'blockhead', 
      title: 'Block Head Report', 
      desc: 'Block head assignments',
      color: '#06b6d4'
    },
    { 
      id: 'admin', 
      title: 'Admin Report', 
      desc: 'Administrator details',
      color: '#ec4899'
    }
  ];

  const handleCardClick = (typeId) => {
    navigate(`?type=${typeId}`);
    setReportType(typeId);
    setReportData(null);
    clearFilters();
  };

  const handleGenerateReport = async () => {
    if (!reportType) {
      alert('Please select a report type');
      return;
    }

    if (!validateFilters()) {
      alert('Please select at least one filter before generating the report');
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

      Object.keys(payload).forEach(key => {
        if (payload[key] === '' || (Array.isArray(payload[key]) && payload[key].length === 0)) {
          delete payload[key];
        }
      });

      const response = await axios.post(
        `http://localhost:5000/api/reports/${reportType}`, 
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.success) {
        setReportData(response.data);
      } else {
        throw new Error('Invalid response format from server');
      }

    } catch (error) {
      console.error('Error generating report:', error);
      
      let errorMessage = 'Failed to generate report';
      if (error.response) {
        errorMessage += `: ${error.response.data?.error || error.response.statusText}`;
      } else if (error.request) {
        errorMessage += ': No response from server. Check if backend is running.';
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Replace the validateFilters function in GenerateReport.jsx with this:

const validateFilters = () => {
  switch (reportType) {
    case 'allocation':
      // Allow report generation if either date filter OR block is selected
      return dateFilterType !== '' || selectedBlock !== '' || selectedPurpose !== '';
      
    case 'vacancy':
      // Allow report generation if either date filter OR block is selected
      return dateFilterType !== '' || selectedBlock !== '';
      
    case 'course':
      return dateFilterType !== '';
      
    case 'block':
      return true;
      
    case 'admin':
      return selectedYear !== '' || (selectedMonth !== '' && selectedYear !== '');
      
    case 'blockhead':
      return true;
      
    default:
      return false;
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

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 50);
    doc.text(`Generated by: Admin`, 14, 57);
    doc.text(`Date Range: ${reportData.report?.summary?.dateRange || 'All Time'}`, 14, 64);

    let yPos = 75;

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
        case 'block':
          headers = ['Block Name', 'Total Rooms', 'Total Beds', 'Allocated', 'Vacant', 'Occupancy', 'Status'];
          tableData = reportData.data.map(item => [
            item.blockName || '-',
            item.totalRooms || '0',
            item.totalBeds || '0',
            item.allocatedBeds || '0',
            item.vacantBeds || '0',
            item.occupancyRate || '0%',
            item.status || '-'
          ]);
          break;
        case 'admin':
          headers = ['Name', 'Email', 'PEN Number', 'Phone Number'];
          tableData = reportData.data.map(item => [
            `${item.firstName || ''} ${item.lastName || ''}`.trim() || '-',
            item.email || '-',
            item.pen || '-',
            item.phoneNumber || '-'
          ]);
          break;
        case 'blockhead':
          headers = ['Name', 'Email', 'PEN Number', 'Phone Number', 'Assigned Block'];
          tableData = reportData.data.map(item => [
            `${item.firstName || ''} ${item.lastName || ''}`.trim() || '-',
            item.email || '-',
            item.pen || '-',
            item.phoneNumber || '-',
            item.assignedBlock || '-'
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

      case 'block':
        headers = ['Block Name', 'Total Rooms', 'Total Beds', 'Allocated Beds', 'Vacant Beds', 'Occupancy Rate', 'Status'];
        rows = reportData.data.map(item => [
          item.blockName,
          item.totalRooms || '0',
          item.totalBeds || '0',
          item.allocatedBeds || '0',
          item.vacantBeds || '0',
          item.occupancyRate || '0%',
          item.status
        ]);
        break;
      
      case 'admin':
        headers = ['Name', 'Email', 'PEN Number', 'Phone Number'];
        rows = reportData.data.map(item => [
          `${item.firstName || ''} ${item.lastName || ''}`.trim(),
          item.email,
          item.pen,
          item.phoneNumber
        ]);
        break;
      
      case 'blockhead':
        headers = ['Name', 'Email', 'PEN Number', 'Phone Number', 'Assigned Block'];
        rows = reportData.data.map(item => [
          `${item.firstName || ''} ${item.lastName || ''}`.trim(),
          item.email,
          item.pen,
          item.phoneNumber,
          item.assignedBlock
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
    if (!dateFilterType) return null;

    return (
      <div className="date-filter-content">
        {dateFilterType === 'dateOnly' && (
          <div className="filter-row">
            <div className="filter-group">
              <label>Select Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
        )}

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

        {dateFilterType === 'monthOnly' && (
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
          </div>
        )}

        {dateFilterType === 'yearOnly' && (
          <div className="filter-row">
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

        {dateFilterType === 'yearRange' && (
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
                Selected: {selectedYears.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFilterOptions = () => {
    switch (reportType) {
      case 'allocation':
        return (
          <>
            <div className="filter-group">
              <label>Date Filter Type</label>
              <select 
                value={dateFilterType} 
                onChange={(e) => setDateFilterType(e.target.value)}
              >
                <option value="">Select Filter Type</option>
                <option value="dateOnly">Date Only</option>
                <option value="monthOnly">Month Only</option>
                <option value="yearOnly">Year Only</option>
                <option value="monthYear">Month & Year</option>
                <option value="yearRange">Year Range</option>
              </select>
            </div>
            {renderDateFilters()}

            <div className="filter-group">
              <label>Select Block</label>
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
          </>
        );

      case 'vacancy':
        return (
          <>
            <div className="filter-group">
              <label>Date Filter Type</label>
              <select 
                value={dateFilterType} 
                onChange={(e) => setDateFilterType(e.target.value)}
              >
                <option value="">Select Filter Type</option>
                <option value="dateOnly">Date Only</option>
                <option value="monthOnly">Month Only</option>
                <option value="yearOnly">Year Only</option>
                <option value="monthYear">Month & Year</option>
                <option value="yearRange">Year Range</option>
              </select>
            </div>
            {renderDateFilters()}
          </>
        );

      case 'course':
        return (
          <>
            <div className="filter-group">
              <label>Date Filter Type</label>
              <select 
                value={dateFilterType} 
                onChange={(e) => setDateFilterType(e.target.value)}
              >
                <option value="">Select Filter Type</option>
                <option value="range">Date Range</option>
                <option value="monthOnly">Month Only</option>
                <option value="yearOnly">Year Only</option>
                <option value="monthYear">Month & Year</option>
                <option value="yearRange">Year Range</option>
              </select>
            </div>
            {renderDateFilters()}
          </>
        );

      case 'admin':
        return (
          <>
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
            <div className="filter-group">
              <label>Month (Optional)</label>
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
          </>
        );

      case 'blockhead':
        return (
          <div className="filter-group">
            <label>Select Block</label>
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
        );

      case 'block':
        return (
          <div className="filter-group">
            <label>Select Block (Optional)</label>
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
        );

      default:
        return null;
    }
  };

  const renderReportTable = () => {
    if (!reportData?.data || reportData.data.length === 0) return null;

    switch (reportType) {
      case 'allocation':
        return (
          <div className="table-wrapper">
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
          </div>
        );

      case 'block':
        return (
          <div className="table-wrapper">
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Block Name</th>
                    <th>Total Rooms</th>
                    <th>Total Beds</th>
                    <th>Allocated Beds</th>
                    <th>Vacant Beds</th>
                    <th>Occupancy Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.data.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.blockName || '-'}</td>
                      <td>{item.totalRooms || 0}</td>
                      <td>{item.totalBeds || 0}</td>
                      <td>{item.allocatedBeds || 0}</td>
                      <td>{item.vacantBeds || 0}</td>
                      <td>{item.occupancyRate || '0%'}</td>
                      <td>{item.status || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'admin':
        return (
          <div className="table-wrapper">
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>PEN Number</th>
                    <th>Phone Number</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.data.map((item, idx) => (
                    <tr key={idx}>
                      <td>{`${item.firstName || ''} ${item.lastName || ''}`.trim() || '-'}</td>
                      <td>{item.email || '-'}</td>
                      <td>{item.pen || '-'}</td>
                      <td>{item.phoneNumber || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'blockhead':
        return (
          <div className="table-wrapper">
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>PEN Number</th>
                    <th>Phone Number</th>
                    <th>Assigned Block</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.data.map((item, idx) => (
                    <tr key={idx}>
                      <td>{`${item.firstName || ''} ${item.lastName || ''}`.trim() || '-'}</td>
                      <td>{item.email || '-'}</td>
                      <td>{item.pen || '-'}</td>
                      <td>{item.phoneNumber || '-'}</td>
                      <td>{item.assignedBlock || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        if (reportData.data.length > 0) {
          const headers = Object.keys(reportData.data[0]);
          return (
            <div className="table-wrapper">
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
    setDateFilterType('');
  };

  const handleBackToSelection = () => {
    navigate('/superadmin/generate-report');
    setReportType('');
    setReportData(null);
    clearFilters();
  };

  const currentReport = reportTypes.find(r => r.id === reportType);

  if (!reportType) {
    return (
      <div className="report-container">
        <main className="report-main">
          <section className="report-section selection-screen">
            <div className="report-header-inline">
              <h2 className="section-title">Choose Report Type</h2>
              <button onClick={() => navigate('/superadmin/dashboard')} className="back-btn-inlineS">
                ← Back to Dashboard
              </button>
            </div>
            <p className="section-subtitle">Select a report to view detailed information and apply filters</p>
            <div className="report-cards-grid">
              {reportTypes.map(type => (
                <div
                  key={type.id}
                  className="modern-card"
                  onClick={() => handleCardClick(type.id)}
                  style={{ '--card-color': type.color }}
                >
                  <div className="card-icon">{type.icon}</div>
                  <h3>{type.title}</h3>
                  <p>{type.desc}</p>
                  <div className="card-arrow">→</div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="report-container" style={{ '--report-color': currentReport?.color }}>
      <main className="report-main report-detail-main">
        <div className="report-detail-header-inline">
          <button onClick={handleBackToSelection} className="back-btn-inline">
            ← All Reports
          </button>
          <div className="report-title-inline">
            <span className="report-icon">{currentReport?.icon}</span>
            <h2>{currentReport?.title}</h2>
          </div>
        </div>

        <section className="report-section">
          <h2 className="section-title">Apply Filters</h2>
          <div className="filters-container">
            
            <div className="other-filters">
              {renderFilterOptions()}

              {reportType === 'allocation' && (
                <div className="filter-group">
                  <label>Purpose (Optional)</label>
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

            <div className="action-buttons">
              <button className="btn-clear" onClick={clearFilters}>
                🗑️ Clear All
              </button>
              <button 
                className="btn-generate" 
                onClick={handleGenerateReport}
                disabled={loading}
              >
                {loading ? '⏳ Generating...' : '📊 Generate Report'}
              </button>
            </div>
          </div>
        </section>

        {loading && (
          <section className="report-section">
            <div className="loading-state">
              <div className="spinner"></div>
              <h3>Generating Your Report</h3>
              <p>Please wait while we fetch the data...</p>
            </div>
          </section>
        )}

        {reportData && !loading && (
          <section className="report-section">
            <div id="report-content">
              <h2 className="section-title">{reportData.report?.reportTitle || 'Generated Report'}</h2>
              
              <div className="report-display">
                {renderReportTable()}
              </div>
            </div>

            <div className="export-actions">
              <button className="btn-export pdf" onClick={handleExportPDF}>
                📄 Export PDF
              </button>
              <button className="btn-export csv" onClick={handleExportCSV}>
                📊 Export CSV
              </button>
              <button className="btn-export print" onClick={handlePrint}>
                🖨️ Print
              </button>
            </div>
          </section>
        )}

        {reportData && reportData.data && reportData.data.length === 0 && !loading && (
          <section className="report-section">
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No Data Found</h3>
              <p>No records match your selected filters. Try adjusting your criteria.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default GenerateReport;