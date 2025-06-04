import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();


  const cardData = [
    { title: "Create User", desc: "Create Admin and Block Heads", path: "/superadmin/create-user" },
    { title: "Design Block", desc: "Maintain and Allocate Rooms for Blocks", path: "/superadmin/design-block" },
    { title: "Course", desc: "Add & Modify Police Training Courses", path: "/superadmin/create-course" },
    { title: "Display Block", desc: "Showcase all details of Admins and Block Info Modules", path: "/superadmin/display-block" },
    { title: "Generate Report", desc: "View, Download, and Print usage and allocation", path: "/superadmin/generate-report" },
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="left-section">
          <img src="/logo.png" alt="Kerala Police Logo" className="logo" />
          <div className="title-group">
            <div className="title">RAMS</div>
            <div className="subtitle">Kerala Police Academy</div>
          </div>
        </div>
        <h2 className="center-title">System Admin</h2>
        <div className="nav-buttons">
          <button onClick={() => navigate('/')} className="nav-button">Home</button>
          <button onClick={() => navigate('/login')} className="nav-button">Logout</button>
        </div>
      </header>

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
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
