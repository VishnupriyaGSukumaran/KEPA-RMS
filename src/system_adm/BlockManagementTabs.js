import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BlockManagementTabs.css';

const BlockManagementTabs = ({ activeTab }) => {
  const navigate = useNavigate();

  const tabs = [
    { id: 'add', label: '➕ Add New Block', path: '/superadmin/add-block' },
    { id: 'modify', label: '✏️ Modify Block', path: '/superadmin/modify-block' },
    { id: 'remove', label: '🗑️ Remove Block', path: '/superadmin/remove-block' }
  ];

  return (
    <div className="tabs-container">
      <h2 className="tabs-title">Block Management</h2>
      <div className="tabs-row">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BlockManagementTabs;