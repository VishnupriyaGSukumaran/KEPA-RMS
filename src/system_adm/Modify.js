import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Modify.css';

const Modify = () => {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [roomCounts, setRoomCounts] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/block');
        const data = await res.json();
        if (res.ok) setBlocks(data);
        else setError('Failed to load blocks');
      } catch (err) {
        setError('Server error while fetching blocks');
      }
    };
    fetchBlocks();
  }, []);

  const handleBlockSelect = async (e) => {
    const blockId = e.target.value;
    if (!blockId) {
      setSelectedBlock(null);
      setRoomCounts({});
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/block/${blockId}`);
      const data = await res.json();
      setSelectedBlock(data);

      const counts = {};
      data.blockTypes.forEach(type => {
        counts[type] = data.roomCounts?.[type] || '';
      });
      setRoomCounts(counts);
    } catch (error) {
      console.error('Failed to load block details:', error);
    }
  };

  const handleRoomCountChange = (type, value) => {
    setRoomCounts(prev => ({ ...prev, [type]: parseInt(value) || '' }));
  };

  const handleSave = async () => {
    if (!selectedBlock || !selectedBlock._id) {
      alert('No block selected');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/block/${selectedBlock._id}/counts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCounts }),
      });

      if (!res.ok) throw new Error('Failed to update room counts');
      alert('Room counts updated successfully!');
    } catch (error) {
      alert('Error saving room counts.');
      console.error(error);
    }
  };

  return (
    <div className="block-page">
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

      <div className="tabs-container">
        <h2 className="tabs-title">Block Management</h2>
        <div className="tabs-row">
          <button className="tab-button" onClick={() => navigate('/superadmin/Add-block')}>➕ Add New Block</button>
          <button className="tab-button active">✏️ Modify Block</button>
          <button className="tab-button" onClick={() => navigate('/superadmin/remove-block')}>🗑️ Remove Block</button>
        </div>
      </div>

      <div className="form-container">
        <h3 className="form-title">📝 Modify Block</h3>
        {error && <p className="error-text">{error}</p>}

        <label className="form-label">Current Block</label>
        <select onChange={handleBlockSelect} defaultValue="" className="form-select">
          <option value="">Select Block to Modify</option>
          {blocks.map(block => (
            <option key={block._id} value={block._id}>
              {block.blockName} - [{block.blockTypes.join(', ')}]
            </option>
          ))}
        </select>

        {selectedBlock && (
          <div className="grid-form">
            {selectedBlock.blockTypes.map(type => (
              <div key={type} className="form-group">
                <label className="form-label">{type} Count</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={roomCounts[type] || ''}
                  onChange={(e) => handleRoomCountChange(type, e.target.value)}
                  placeholder={`Enter number of ${type}s`}
                />
              </div>
            ))}
          </div>
        )}

        <div className="button-group">
          <div className="btn-left">
            <button onClick={() => navigate('/superadmin')} className="btn-back">← Back</button>
          </div>
          <div className="btn-right">
            <button
              onClick={() => {
                setSelectedBlock(null);
                setRoomCounts({});
              }}
              className="btn-clear"
            >
              Clear
            </button>
            <button onClick={handleSave} className="btn-save">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modify;
