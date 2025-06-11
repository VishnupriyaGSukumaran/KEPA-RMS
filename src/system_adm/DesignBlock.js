import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DesignBlock.css';

const DesignBlock = () => {
  const navigate = useNavigate();
  const [blockName, setBlockName] = useState('');
  const [blockTypes, setBlockTypes] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [message, setMessage] = useState('');
  const dropdownRef = useRef(null);

  const options = ['Suit Room', 'Room', 'Dormitory', 'Barrack', ];

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleCheckboxChange = (type) => {
    if (blockTypes.includes(type)) {
      setBlockTypes(blockTypes.filter((t) => t !== type));
    } else {
      setBlockTypes([...blockTypes, type]);
    }
  };

  const clearForm = () => {
    setBlockName('');
    setBlockTypes([]);
    setMessage('');
  };

  const saveBlock = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockName, blockTypes }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Block saved successfully!');
        clearForm();
      } else {
        alert(data.message || 'Failed to save block');
      }
    } catch (err) {
      alert('Server error');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="block-container">
      {/* Top Bar */}
      <div className="header">
        <div className="logo-area">
          <img src="/logo.png" alt="Logo" />
          <div>
            <div className="title">RAMS</div>
            <div className="subtitle">Kerala Police</div>
          </div>
        </div>
        <div className="page-title">System Admin</div>
        <div className="nav">
          <button onClick={() => navigate('/')} className="nav-btn">Home</button>
          <button onClick={() => navigate('/login')} className="nav-btn">Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <h2 className="tabs-title">Block Management</h2>
        <div className="tabs-row">
          <button className="tab-button active">➕ Add New Block</button>
          <button className="tab-button" onClick={() => navigate('/superadmin/modify-block')}>✏️ Modify Block</button>
          <button className="tab-button" onClick={() => navigate('/superadmin/remove-block')}>🗑️ Remove Block</button>
        </div>
      </div>

      {/* Form */}
      <div className="form-area">
        <h3>➕ Add New Block</h3>
        <p>Create a new block structure for the police academy</p>

        <div className="form-grid">
          <input
            type="text"
            placeholder="Block Name"
            value={blockName}
            onChange={(e) => setBlockName(e.target.value)}
          />

          {/* Custom Dropdown with Checkboxes */}
          <div className="custom-dropdown" ref={dropdownRef}>
            <div className="dropdown-header" onClick={toggleDropdown}>
              {blockTypes.length > 0
                ? blockTypes.join(', ')
                : 'Select Block Types'}
              <span className="dropdown-arrow">{dropdownOpen ? '▲' : '▼'}</span>
            </div>
            {dropdownOpen && (
              <div className="dropdown-list">
                {options.map((type) => (
                  <label key={type} className="dropdown-item">
                    <input
                      type="checkbox"
                      checked={blockTypes.includes(type)}
                      onChange={() => handleCheckboxChange(type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="bottom-buttons">
          <button className="back-btn" onClick={() => navigate('/superadmin/dashboard')}>Back</button>
          <div className="right-buttons">
            <button onClick={clearForm} className="cancel-btn">Cancel</button>
            <button onClick={saveBlock} className="save-btn">Save Block</button>
          </div>
        </div>

        {message && <p className="success">{message}</p>}
        
      </div>
    </div>
  );
};

export default DesignBlock;
