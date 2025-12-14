import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hoveredNotification, setHoveredNotification] = useState(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleToggleNotifications = async () => {
    const isOpening = !showNotifications;
    setShowNotifications(isOpening);

    if (isOpening && unreadCount > 0) {
      try {
        await axios.put('http://localhost:5000/api/notifications/mark-all-read');
        await fetchNotifications();
      } catch (error) {
        console.error('Failed to mark notifications as read:', error);
      }
    }
  };

  // ✅ Navigate to notifications page
  const handleViewAllNotifications = () => {
    navigate('/superadmin/notifications');
  };

  // ✅ Handle clicking on a single notification - navigate to notifications page
  const handleNotificationClick = () => {
    navigate('/superadmin/notifications');
  };

  // ✅ Mark all as read (NOT delete)
  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('http://localhost:5000/api/notifications/mark-all-read');
      await fetchNotifications();
      setShowNotifications(false);
      alert('✅ All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark as read:', err);
      alert('❌ Failed to mark notifications as read');
    }
  };

  const cardData = [
    { title: "Create User", desc: "Create Admin and Block Heads", path: "/superadmin/create-user" },
    { title: "Design Block", desc: "Maintain and Allocate Rooms for Blocks", path: "/superadmin/add-block" },
    { title: "Course", desc: "Add & Modify Police Training Courses", path: "/superadmin/create-course" },
    { title: "Display Block", desc: "Showcase all details of Admins and Block Info Modules", path: "/superadmin/display-block" },
    { title: "Generate Report", desc: "View, Download, and Print usage and allocation", path: "/superadmin/generate-report" },
  ];

  // Get the latest notification for hover preview
  const latestNotification = notifications.length > 0 ? notifications[0] : null;

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <div className="card-grid">
          {cardData.map(({ title, desc, path }) => (
            <div key={title} className="custom-card">
              <button className="card-button" onClick={() => navigate(path)}>
                {title}
              </button>
              <p className="card-desc">{desc}</p>
            </div>
          ))}

          {/* 🔔 Notifications Card - Click navigates to notifications page */}
          <div 
            className="custom-card notification-card"
            onMouseEnter={() => setHoveredNotification(latestNotification)}
            onMouseLeave={() => setHoveredNotification(null)}
          >
            <button 
              className="card-button" 
              onClick={handleViewAllNotifications} // ✅ Navigate to notifications page
            >
              Notifications 
              {unreadCount > 0 && (
                <span style={{ 
                  background: '#dc3545', 
                  color: 'white', 
                  borderRadius: '12px', 
                  padding: '2px 8px', 
                  fontSize: '12px', 
                  marginLeft: '8px',
                  fontWeight: 'bold'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
            <p className="card-desc">Notification from Admin</p>

            {/* ✅ Hover Preview - Shows Latest Notification */}
            {hoveredNotification && (
              <div 
                className="notification-preview" 
                onClick={handleViewAllNotifications} // ✅ Navigate on click
              >
                <div className="preview-header">
                  <span className="preview-badge">Latest</span>
                  <span className="preview-time">
                    {new Date(hoveredNotification.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="preview-title">
                  {hoveredNotification.message}
                </div>
                <div className="preview-content">
                  <div><strong>Title:</strong> {hoveredNotification.data?.title || 'N/A'}</div>
                  <div className="preview-description">
                    <strong>Description:</strong> 
                    {hoveredNotification.data?.description?.substring(0, 80) || 'N/A'}
                    {hoveredNotification.data?.description?.length > 80 ? '...' : ''}
                  </div>
                </div>
                <div className="preview-footer">
                  Click to view all notifications →
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;