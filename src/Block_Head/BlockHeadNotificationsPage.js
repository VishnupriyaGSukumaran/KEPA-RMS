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
  FaClock,
  FaCheckCircle,
  FaExclamationCircle
} from 'react-icons/fa';
import './BlockHeadDashboard.css';

const BlockHeadNotifications = () => {
  const pen = localStorage.getItem('pen');
  const blockNameFromStorage = localStorage.getItem('assignedBlock');
  const [userData, setUserData] = useState(null);
  const [blockName, setBlockName] = useState(blockNameFromStorage || '');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

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
    
    fetchNotifications();
  }, [blockName]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/allocations/block/${encodeURIComponent(blockName)}`);
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:5000/api/allocations/${notificationId}/read`, {
        method: 'PATCH'
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock />;
      case 'approved': return <FaCheckCircle />;
      case 'rejected': return <FaExclamationCircle />;
      default: return <FaBell />;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'read') return notif.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
          <Link to="/blockhead/notifications" className="active"><FaBell /> Notifications</Link>
          <Link to="/blockhead/reports"><FaFileAlt /> Reports</Link>
        </nav>
      </aside>
      
      <main className="main-contentt">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>ALLOCATION NOTIFICATIONS</h3>
            <p style={{ color: '#666', margin: '0.5rem 0 0 0' }}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setFilter('all')}
              style={{
                padding: '0.5rem 1rem',
                border: filter === 'all' ? '2px solid #14008a' : '1px solid #ddd',
                backgroundColor: filter === 'all' ? '#f0f4ff' : 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: filter === 'all' ? '600' : '400'
              }}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('unread')}
              style={{
                padding: '0.5rem 1rem',
                border: filter === 'unread' ? '2px solid #14008a' : '1px solid #ddd',
                backgroundColor: filter === 'unread' ? '#f0f4ff' : 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: filter === 'unread' ? '600' : '400'
              }}
            >
              Unread
            </button>
            <button 
              onClick={() => setFilter('read')}
              style={{
                padding: '0.5rem 1rem',
                border: filter === 'read' ? '2px solid #14008a' : '1px solid #ddd',
                backgroundColor: filter === 'read' ? '#f0f4ff' : 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: filter === 'read' ? '600' : '400'
              }}
            >
              Read
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <FaBell style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <FaBell style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
            <p>No notifications found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                style={{
                  backgroundColor: notification.isRead ? '#ffffff' : '#f8f9ff',
                  border: `2px solid ${notification.isRead ? '#e5e7eb' : '#14008a'}`,
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onClick={() => !notification.isRead && markAsRead(notification._id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ 
                        color: getStatusColor(notification.status),
                        fontSize: '1.2rem'
                      }}>
                        {getStatusIcon(notification.status)}
                      </span>
                      <h4 style={{ 
                        margin: 0, 
                        color: '#14008a',
                        fontSize: '1.1rem',
                        fontWeight: '600'
                      }}>
                        {notification.purpose || 'Allocation Order'}
                      </h4>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: getStatusColor(notification.status) + '20',
                        color: getStatusColor(notification.status)
                      }}>
                        {notification.status || 'pending'}
                      </span>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem',
                      marginTop: '1rem'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#666', display: 'block' }}>Officers</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333' }}>
                          {notification.officerCount}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#666', display: 'block' }}>Duration</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#333' }}>
                          {new Date(notification.fromDate).toLocaleDateString()} - {new Date(notification.toDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#666', display: 'block' }}>Requested</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#333' }}>
                          {new Date(notification.createdAt || notification.fromDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {notification.notes && (
                      <div style={{ 
                        marginTop: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        color: '#555'
                      }}>
                        <strong>Notes:</strong> {notification.notes}
                      </div>
                    )}

                    {notification.officerFile && (
                      <div style={{ marginTop: '1rem' }}>
                        <a 
                          href={`http://localhost:5000/${notification.officerFile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#14008a',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FaDownload /> Download Officer List
                        </a>
                      </div>
                    )}
                  </div>

                  {!notification.isRead && (
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#14008a',
                      flexShrink: 0
                    }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BlockHeadNotifications;