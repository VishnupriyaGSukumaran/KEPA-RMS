import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddBlock.css';

const DesignBlock = () => {
  const navigate = useNavigate();
  const [blockName, setBlockName] = useState('');
  const [blockTypes, setBlockTypes] = useState([]);
  const [roomCounts, setRoomCounts] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({ blockName: '', roomCounts: {} });
  const [roomsCreated, setRoomsCreated] = useState(false);

  const dropdownRef = useRef(null);
  const baseOptions = ['Suite Room', 'Room', 'Dormitory', 'Barrack'];
  const fullOptions = ['Select All', ...baseOptions];

  useEffect(() => {
    sessionStorage.removeItem('roomsCreated'); // clear on initial load
  }, []);

  useEffect(() => {
    const created = sessionStorage.getItem('roomsCreated');
    setRoomsCreated(created === 'true');
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleCheckboxChange = (type) => {
    if (type === 'Select All') {
      if (blockTypes.length === baseOptions.length) {
        setBlockTypes([]);
        setRoomCounts({});
      } else {
        const newTypes = [...baseOptions];
        const newCounts = {};
        newTypes.forEach((t) => {
          newCounts[t] = roomCounts[t] || '';
        });
        setBlockTypes(newTypes);
        setRoomCounts(newCounts);
      }
      return;
    }

    if (blockTypes.includes(type)) {
      const updatedTypes = blockTypes.filter(t => t !== type);
      const updatedCounts = { ...roomCounts };
      delete updatedCounts[type];
      setBlockTypes(updatedTypes);
      setRoomCounts(updatedCounts);
    } else {
      setBlockTypes([...blockTypes, type]);
      setRoomCounts({ ...roomCounts, [type]: '' });
    }
  };

  const handleRoomCountChange = (type, value) => {
    setRoomCounts(prev => ({ ...prev, [type]: parseInt(value) || '' }));
  };

  const clearForm = () => {
    setBlockName('');
    setBlockTypes([]);
    setRoomCounts({});
    setErrors({ blockName: '', roomCounts: {} });
    sessionStorage.removeItem('roomsCreated');
    sessionStorage.removeItem('createdRooms');
    setRoomsCreated(false);
  };

  const toTitleCase = (input) => {
    return input
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleCreateRoom = async () => {
    let hasError = false;
    const newErrors = { blockName: '', roomCounts: {} };

    if (!blockName.trim()) {
      newErrors.blockName = 'Block name is required.';
      hasError = true;
    } else if (!/^[a-zA-Z\s]+$/.test(blockName)) {
      newErrors.blockName = 'Block name must contain only letters and spaces.';
      hasError = true;
    }

    if (blockTypes.length === 0) {
      setModalMessage('⚠️ Please select at least one block type.');
      setShowModal(true);
      return;
    }

    for (const type of blockTypes) {
      const count = roomCounts[type];
      if (count === '' || isNaN(count) || count < 0) {
        newErrors.roomCounts[type] = 'Please enter a valid non-negative number.';
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    let formattedBlockName = blockName.trim();
    if (/^[A-Za-z]$/.test(formattedBlockName)) {
      formattedBlockName = `${formattedBlockName} Block`;
    }
    formattedBlockName = toTitleCase(formattedBlockName);

    try {
      const res = await fetch('http://localhost:5000/api/block');
      const blocks = await res.json();

      const exists = blocks.some(
        b => toTitleCase(b.blockName) === formattedBlockName
      );

      if (exists) {
        setModalMessage(`⚠️ Block "${formattedBlockName}" already exists!`);
        setShowModal(true);
        return;
      }

      sessionStorage.setItem('blockData', JSON.stringify({
        blockName: formattedBlockName,
        blockTypes,
        roomCounts
      }));

      navigate('/superadmin/create-rooms');
    } catch (err) {
      setModalMessage('❌ Failed to check for duplicate block');
      setShowModal(true);
    }
  };

  return (
    <div className="block-container">
      <div className="tabs-container">
        <h2 className="tabs-title">Block Management</h2>
        <div className="tabs-row">
          <button className="tab-button active">➕ Add New Block</button>
          <button className="tab-button" onClick={() => navigate('/superadmin/modify-block')}>✏️ Modify Block</button>
          <button className="tab-button" onClick={() => navigate('/superadmin/remove-block')}>🗑️ Remove Block</button>
        </div>
      </div>

      <div className="form-area">
        <h3>➕ Add New Block</h3>
        <p>Create a new block and set room counts</p>

        <div className="form-grid">
          <input
            type="text"
            placeholder="Block Name"
            value={blockName}
            onChange={(e) => setBlockName(e.target.value)}
          />
          {errors.blockName && <p className="error-text">{errors.blockName}</p>}

          <div className="custom-dropdown" ref={dropdownRef}>
            <div className="dropdown-header" onClick={toggleDropdown}>
              {blockTypes.length > 0 ? blockTypes.join(', ') : 'Select Block Types'}
              <span className="dropdown-arrow">{dropdownOpen ? '▲' : '▼'}</span>
            </div>
            {dropdownOpen && (
              <div className="dropdown-list">
                {fullOptions.map((type) => (
                  <label key={type} className="dropdown-item">
                    <input
                      type="checkbox"
                      checked={
                        type === 'Select All'
                          ? blockTypes.length === baseOptions.length
                          : blockTypes.includes(type)
                      }
                      onChange={() => handleCheckboxChange(type)}
                    />
                    <span className="label-text">{type}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {blockTypes.length > 0 && (
          <div className="form-grid room-count-grid">
            {blockTypes.map((type) => (
              <div key={type}>
                <label>{type} Count</label>
                <input
                  type="number"
                  min="0"
                  value={roomCounts[type] || ''}
                  onChange={(e) => handleRoomCountChange(type, e.target.value)}
                  placeholder={`Enter number of ${type}s`}
                />
                <span className="block-name-note">Block name is case-insensitive and must be unique.</span>
                {errors.roomCounts[type] && <p className="error-text">{errors.roomCounts[type]}</p>}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="success-modal-overlay">
            <div className="success-modal-box">
              <p>{modalMessage}</p>
              <button onClick={() => setShowModal(false)} className="success-button">OK</button>
            </div>
          </div>
        )}

        {blockTypes.length > 0 && Object.values(roomCounts).every(c => c !== '' && !isNaN(c)) && (
          <div className="create-room-wrapper">
            <button onClick={handleCreateRoom} className="create-room-btn">Create Room</button>
          </div>
        )}

        <div className="bottom-buttons">
          <button className="back-btn" onClick={() => navigate('/superadmin/dashboard')}>Back</button>
          <div className="right-buttons">
            <button onClick={clearForm} className="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignBlock;
