import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

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

  const cardData = [
    { title: "Create User", desc: "Create Admin and Block Heads", path: "/superadmin/create-user" },
    { title: "Design Block", desc: "Maintain and Allocate Rooms for Blocks", path: "/superadmin/add-block" },
    { title: "Course", desc: "Add & Modify Police Training Courses", path: "/superadmin/create-course" },
    { title: "Display Block", desc: "Showcase all details of Admins and Block Info Modules", path: "/superadmin/display-block" },
    { title: "Generate Report", desc: "View, Download, and Print usage and allocation", path: "/superadmin/generate-report" },
  ];

  return (
    <div className="dashboard-container">
      {/* Main cards */}
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

          {/* 🔔 Notifications Card */}
          <div className="custom-card">
            <button className="card-button" onClick={handleToggleNotifications}>
              Notifications {unreadCount > 0 && <span style={{ color: 'red' }}>({unreadCount})</span>}
            </button>
            <p className="card-desc">Notification from Admin</p>

            {showNotifications && (
              <div className="notification-dropdown">
                <ul>
                  {notifications.length === 0 ? (
                    <li className="empty-msg">No notifications</li>
                  ) : (
                    notifications.map((note, index) => (
                      <li key={index}>🔔 {note.message}</li>
                    ))
                  )}
                </ul>

                {notifications.length > 0 && (
                  <button className="clear-btn" onClick={async () => {
                    try {
                      await axios.delete('http://localhost:5000/api/notifications/clear-all');
                      await fetchNotifications();
                    } catch (err) {
                      console.error('Failed to clear notifications:', err);
                    }
                  }}>
                    Clear All
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
