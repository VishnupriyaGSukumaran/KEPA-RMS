import React, { useEffect, useState } from 'react';
import {
  FaTachometerAlt,
  FaDoorOpen,
  FaDoorClosed,
  FaList,
  FaBell,
  FaFileAlt,
  FaDownload,
  FaCalendarAlt,
  FaUsers,
  FaBed,
  FaChartBar
} from 'react-icons/fa';

const BlockHeadReports = () => {
  const pen = localStorage.getItem('pen');
  const blockNameFromStorage = localStorage.getItem('assignedBlock');
  const [userData, setUserData] = useState(null);
  const [blockName, setBlockName] = useState(blockNameFromStorage || '');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

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
        }
      })
      .catch(err => console.error('Error fetching user data:', err));
  }, [pen, blockNameFromStorage]);

  useEffect(() => {
    if (!blockName) return;
    fetchReportData();
  }, [blockName, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      const blockResponse = await fetch(`http://localhost:5000/api/block/name/${encodeURIComponent(blockName)}`);
      const blockData = await blockResponse.json();
      
      const allocationsResponse = await fetch(
        `http://localhost:5000/api/allocations/block/${encodeURIComponent(blockName)}`
      );
      const allocations = allocationsResponse.ok ? await allocationsResponse.json() : [];

      const allAllocationsResponse = await fetch('http://localhost:5000/api/room-allocation');
      const allAllocations = allAllocationsResponse.ok ? await allAllocationsResponse.json() : [];

      const blockAllocations = allAllocations.filter(alloc => 
        alloc.blockName?.toLowerCase() === blockName.toLowerCase()
      );

      const filteredAllocations = blockAllocations.filter(alloc => {
        const allocDate = new Date(alloc.allocationDate);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        return allocDate >= start && allocDate <= end;
      });

      const purposeBreakdown = filteredAllocations.reduce((acc, alloc) => {
        const purpose = alloc.purpose || 'Other';
        acc[purpose] = (acc[purpose] || 0) + 1;
        return acc;
      }, {});

      setReportData({
        block: blockData,
        totalAllocations: filteredAllocations.length,
        currentOccupancy: blockAllocations.length,
        purposeBreakdown,
        recentAllocations: filteredAllocations.slice(0, 10),
        occupancyRate: blockData.totalBeds > 0 
          ? ((blockData.totalBeds - blockData.vacantBeds) / blockData.totalBeds * 100).toFixed(1)
          : 0
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${blockName} - Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #14008a; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #14008a; color: white; }
            .stat-box { display: inline-block; padding: 15px; margin: 10px; border: 2px solid #14008a; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>${blockName} - Allocation Report</h1>
          <p><strong>Report Period:</strong> ${new Date(dateRange.startDate).toLocaleDateString()} to ${new Date(dateRange.endDate).toLocaleDateString()}</p>
          
          <div>
            <div class="stat-box">
              <h3>Total Beds</h3>
              <p style="font-size: 24px; margin: 0;">${reportData?.block.totalBeds || 0}</p>
            </div>
            <div class="stat-box">
              <h3>Occupied</h3>
              <p style="font-size: 24px; margin: 0;">${reportData?.block.totalBeds - reportData?.block.vacantBeds || 0}</p>
            </div>
            <div class="stat-box">
              <h3>Vacant</h3>
              <p style="font-size: 24px; margin: 0;">${reportData?.block.vacantBeds || 0}</p>
            </div>
            <div class="stat-box">
              <h3>Occupancy Rate</h3>
              <p style="font-size: 24px; margin: 0;">${reportData?.occupancyRate || 0}%</p>
            </div>
          </div>

          <h2>Purpose Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Purpose</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(reportData?.purposeBreakdown || {}).map(([purpose, count]) => `
                <tr>
                  <td>${purpose}</td>
                  <td>${count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>Recent Allocations</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Room</th>
                <th>Purpose</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${(reportData?.recentAllocations || []).map(alloc => `
                <tr>
                  <td>${alloc.name}</td>
                  <td>${alloc.roomNumber}</td>
                  <td>${alloc.purpose}</td>
                  <td>${new Date(alloc.allocationDate).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <p style="margin-top: 40px; color: #666;">Generated on ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const downloadCSV = () => {
    const csvContent = [
      ['Name', 'Room', 'Purpose', 'Allocation Date'],
      ...(reportData?.recentAllocations || []).map(alloc => [
        alloc.name,
        alloc.roomNumber,
        alloc.purpose,
        new Date(alloc.allocationDate).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blockName}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', paddingTop: '80px' }}>
      <aside style={{
        backgroundColor: '#14008a',
        width: '250px',
        color: 'white',
        padding: '20px',
        position: 'fixed',
        top: '62px',
        left: 0,
        bottom: 0,
        overflowY: 'auto',
        boxSizing: 'border-box',
        zIndex: 100
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '0.3rem', fontSize: '1.1rem' }}>
            {userData ? `Insp. ${userData.firstName} ${userData.lastName}` : 'Loading...'}
          </h3>
          <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.8 }}>
            Block Head - {blockName || ''}
          </p>
        </div>
        <nav>
          <a href={`/blockhead/dashboard/${blockName}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '8px',
            transition: 'all 0.3s ease',
            fontWeight: '500',
            fontSize: '0.95rem'
          }}>
            <FaTachometerAlt /> Dashboard
          </a>
          <a href="/blockhead/AllocateRoom" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '8px',
            transition: 'all 0.3s ease',
            fontWeight: '500',
            fontSize: '0.95rem'
          }}>
            <FaDoorOpen /> Allocate Room
          </a>
          <a href="/blockhead/VacateRoom" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '8px',
            transition: 'all 0.3s ease',
            fontWeight: '500',
            fontSize: '0.95rem'
          }}>
            <FaDoorClosed /> Vacate Room
          </a>
          <a href={`/blockhead/ViewBlock/${blockName}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '8px',
            transition: 'all 0.3s ease',
            fontWeight: '500',
            fontSize: '0.95rem'
          }}>
            <FaList /> Display Block
          </a>
          <a href="/blockhead/notifications" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '8px',
            transition: 'all 0.3s ease',
            fontWeight: '500',
            fontSize: '0.95rem'
          }}>
            <FaBell /> Notifications
          </a>
          <a href="/blockhead/reports" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'white',
            textDecoration: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            fontWeight: '600',
            fontSize: '0.95rem'
          }}>
            <FaFileAlt /> Reports
          </a>
        </nav>
      </aside>
      
      <main style={{
        flex: 1,
        padding: '40px',
        backgroundColor: '#ffffff',
        marginLeft: '250px',
        minHeight: '100vh'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.8rem', color: '#1a1a2e' }}>
            {blockName?.toUpperCase() || ''} REPORTS
          </h3>
          <p style={{ color: '#666', margin: '0.5rem 0 0 0' }}>
            Generate and download comprehensive reports
          </p>
        </div>

        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <FaCalendarAlt style={{ color: '#14008a', fontSize: '1.2rem' }} />
            <div>
              <label style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={generatePDFReport}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#14008a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}
            >
              <FaDownload /> Generate PDF
            </button>
            <button
              onClick={downloadCSV}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}
            >
              <FaDownload /> Download CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <FaChartBar style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
            <p>Loading report data...</p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', fontWeight: '600' }}>Total Beds</p>
                    <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', color: '#14008a' }}>
                      {reportData?.block.totalBeds || 0}
                    </h2>
                  </div>
                  <FaBed style={{ fontSize: '2rem', color: '#14008a', opacity: 0.3 }} />
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', fontWeight: '600' }}>Occupied</p>
                    <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', color: '#14008a' }}>
                      {reportData ? reportData.block.totalBeds - reportData.block.vacantBeds : 0}
                    </h2>
                  </div>
                  <FaUsers style={{ fontSize: '2rem', color: '#14008a', opacity: 0.3 }} />
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', fontWeight: '600' }}>Vacant</p>
                    <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', color: '#14008a' }}>
                      {reportData?.block.vacantBeds || 0}
                    </h2>
                  </div>
                  <FaBed style={{ fontSize: '2rem', color: '#14008a', opacity: 0.3 }} />
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', fontWeight: '600' }}>Occupancy Rate</p>
                    <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', color: '#14008a' }}>
                      {reportData?.occupancyRate || 0}%
                    </h2>
                  </div>
                  <FaChartBar style={{ fontSize: '2rem', color: '#14008a', opacity: 0.3 }} />
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '2rem'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#14008a' }}>
                Purpose Breakdown
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                {Object.entries(reportData?.purposeBreakdown || {}).map(([purpose, count]) => (
                  <div key={purpose} style={{
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{purpose}</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#14008a' }}>
                      {count}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#14008a' }}>
                Recent Allocations
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Room</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Purpose</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData?.recentAllocations || []).map((alloc, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px' }}>{alloc.name}</td>
                        <td style={{ padding: '12px' }}>{alloc.roomNumber}</td>
                        <td style={{ padding: '12px' }}>{alloc.purpose}</td>
                        <td style={{ padding: '12px' }}>{new Date(alloc.allocationDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default BlockHeadReports;