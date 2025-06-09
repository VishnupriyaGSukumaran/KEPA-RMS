import React from "react";
import { useNavigate } from "react-router-dom";
import "./ADashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const notifications = [
    {
      title: "Allocation confirmed by Block Head",
      detail: "Block D - Room 305 has been allocated to Inspector Sharma",
      time: "30 minutes ago",
    },
    {
      title: "Vacancy Notification",
      detail: "Block A - Room 112 is now vacant",
      time: "2 hours ago",
    },
  ];

  return (
    <div className="container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>RAMS</h2>
          <p>Kerala Police</p>
        </div>
        <div className="sidebar-user">
          <p className="user-name">Admin User</p>
          <p className="user-email">admin@policeacademy.edu</p>
        </div>
        <div className="sidebar-menu">
          <div className="menu-item active" onClick={() => navigate("/")}>
            Dashboard
          </div>
          <p className="menu-title">MANAGEMENT</p>
          <div className="menu-item" onClick={() => navigate("/blocks-rooms")}>
            Blocks & Rooms
          </div>
          <div className="menu-item" onClick={() => navigate("/block-heads")}>
            Block heads
          </div>
          <div className="menu-item" onClick={() => navigate("/allocations")}>
            Allocations
          </div>
          <div className="menu-item" onClick={() => navigate("/reports")}>
            Reports
          </div>
          <div className="menu-item" onClick={() => navigate("/notifications")}>
            Notifications
          </div>
        </div>
        <div className="sidebar-footer">
          <button className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="main">
        <div className="main-header">
          <h2>ADMIN</h2>
          <div className="home-icon">🏠</div>
        </div>

        <div className="stats">
          <div className="stat-card">
            <p>Total Blocks</p>
            <h3>12</h3>
          </div>
          <div className="stat-card">
            <p>Allocated Rooms</p>
            <h3>84</h3>
          </div>
          <div className="stat-card">
            <p>Vacant Rooms</p>
            <h3>28</h3>
          </div>
          <div className="stat-card">
            <p>Pending Order</p>
            <h3>5</h3>
            <span className="more">...</span>
          </div>
        </div>

        <div className="notifications">
          <div className="notif-header">
            <h3>Recent Notifications</h3>
            <button className="view-all">View All</button>
          </div>
          <ul className="notif-list">
            {notifications.map((n, index) => (
              <li key={index} className="notif-item">
                <strong>{n.title}</strong>
                <p>{n.detail}</p>
                <span>{n.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
