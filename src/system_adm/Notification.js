import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaFileAlt, FaDownload, FaCheckCircle, FaTrash, FaClock, FaCheckDouble } from 'react-icons/fa';
import './Notification.css';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
  };

  const handleDownloadFile = async (filePath, fileName) => {
    try {
      const response = await axios.get(`http://localhost:5000/uploads/${filePath}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file');
    }
  };

  const handleAcknowledge = async (notificationId) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${notificationId}/acknowledge`);
      await fetchNotifications();
      setShowDetailModal(false);
      setSelectedNotification(null);
      alert('✅ Course order acknowledged successfully!');
    } catch (error) {
      console.error('Failed to acknowledge:', error);
      alert('❌ Failed to acknowledge notification');
    }
  };

  // ✅ Delete individual notification
  const handleDelete = async (notificationId, event) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this notification permanently?')) {
      try {
        await axios.delete(`http://localhost:5000/api/notifications/${notificationId}`);
        await fetchNotifications();
        alert('✅ Notification deleted successfully!');
      } catch (error) {
        console.error('Failed to delete:', error);
        alert('❌ Failed to delete notification');
      }
    }
  };

  // ✅ Mark all as acknowledged (NOT delete)
  const handleClearAll = async () => {
    if (window.confirm('Mark all notifications as acknowledged? They will remain in the database.')) {
      try {
        await axios.delete('http://localhost:5000/api/notifications/clear-all');
        await fetchNotifications();
        alert('✅ All notifications marked as acknowledged!');
      } catch (err) {
        console.error('Failed to clear notifications:', err);
        alert('❌ Failed to clear notifications');
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const acknowledgedCount = notifications.filter(n => n.acknowledged).length;

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <button className="back-btn" onClick={() => navigate('/superadmin/dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1>All Notifications</h1>
        <div className="notification-count">
          {notifications.length} Total | {unreadCount} Unread | {acknowledgedCount} Acknowledged
        </div>
      </div>

      {/* ✅ Action Buttons */}
      <div className="action-buttons">
        <button className="mark-all-read-btn" onClick={async () => {
          try {
            await axios.put('http://localhost:5000/api/notifications/mark-all-read');
            await fetchNotifications();
            alert('✅ All notifications marked as read!');
          } catch (error) {
            console.error('Failed to mark as read:', error);
            alert('❌ Failed to mark notifications as read');
          }
        }}>
          <FaCheckDouble /> Mark All as Read
        </button>
        
        <button className="clear-all-btn" onClick={handleClearAll}>
          <FaCheckCircle /> Mark All as Acknowledged
        </button>
      </div>

      <div className="notifications-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <FaFileAlt className="empty-icon" />
            <h2>No Notifications</h2>
            <p>You don't have any notifications at the moment.</p>
          </div>
        ) : (
          <div className="notifications-grid">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-card ${notification.acknowledged ? 'acknowledged-card' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="card-header">
                  <div className="card-icon">
                    <FaFileAlt />
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(notification._id, e)}
                    title="Delete notification permanently"
                  >
                    <FaTrash />
                  </button>
                </div>
                
                <h3 className="card-title">{notification.message}</h3>
                
                <div className="card-details">
                  <div className="detail-item">
                    <strong>Title:</strong> {notification.data?.title || 'N/A'}
                  </div>
                  <div className="detail-item description">
                    <strong>Description:</strong> 
                    <span>{notification.data?.description?.substring(0, 100) || 'N/A'}
                    {notification.data?.description?.length > 100 ? '...' : ''}</span>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="timestamp">
                    <FaClock />
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                  {notification.data?.fileName && (
                    <div className="has-attachment">
                      <FaFileAlt /> Has Attachment
                    </div>
                  )}
                </div>

                {/* ✅ Show different badges */}
                {notification.acknowledged && (
                  <div className="acknowledged-badge">Acknowledged</div>
                )}
                {!notification.read && !notification.acknowledged && (
                  <div className="unread-badge">New</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="modal-backdrop" onClick={() => setShowDetailModal(false)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Course Order Details</h2>
              <button onClick={() => setShowDetailModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <label>Course Title</label>
                <div className="detail-value">
                  {selectedNotification.data?.title || 'N/A'}
                </div>
              </div>

              <div className="detail-section">
                <label>Description</label>
                <div className="detail-value">
                  {selectedNotification.data?.description || 'N/A'}
                </div>
              </div>

              {selectedNotification.data?.fileName && (
                <div className="detail-section">
                  <label>Attached File</label>
                  <div className="file-section">
                    <FaFileAlt className="file-icon" />
                    <span className="file-name">
                      {selectedNotification.data.fileName}
                    </span>
                    <button
                      className="download-btn"
                      onClick={() => handleDownloadFile(
                        selectedNotification.data.filePath,
                        selectedNotification.data.fileName
                      )}
                    >
                      <FaDownload /> Download
                    </button>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <label>Received On</label>
                <div className="detail-value">
                  {new Date(selectedNotification.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="detail-section">
                <label>Status</label>
                <div className="detail-value">
                  {selectedNotification.acknowledged ? '✅ Acknowledged' : 
                   selectedNotification.read ? '👁️ Read' : '🆕 Unread'}
                </div>
              </div>

              <div className="detail-section">
                <label>From</label>
                <div className="detail-value">Admin Department</div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
              {!selectedNotification.acknowledged && (
                <button
                  className="acknowledge-btn"
                  onClick={() => handleAcknowledge(selectedNotification._id)}
                >
                  <FaCheckCircle /> Acknowledge & Process
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;