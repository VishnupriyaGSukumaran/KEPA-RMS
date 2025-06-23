import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RemoveBlock.css';

const RemoveBlock = () => {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/block');
      const data = await res.json();
      if (res.ok) {
        setBlocks(data);
        setError('');
      } else {
        setError('Failed to load blocks.');
      }
    } catch (err) {
      setError('Server error while fetching blocks.');
    }
  };

  const handleRemoveBlock = async () => {
    if (!selectedBlock) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/block/${selectedBlock}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || 'Block deleted successfully.');
        setBlocks(prev => prev.filter(b => b._id !== selectedBlock));
        setSelectedBlock('');
        setConfirmDelete(false);
        setError('');
      } else {
        setError(result.message || 'Failed to delete block.');
      }
    } catch (err) {
      console.error("Error deleting block:", err);
      setError('Failed to remove block due to server error.');
    } finally {
      setLoading(false);
    }
  };

  const getBlockNameById = (id) => {
    const found = blocks.find(b => b._id === id);
    return found ? found.blockName : '';
  };

  return (
    <div className="block-container">
      {/* Header */}
      {/* <div className="header">
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
      </div> */}

      {/* Tabs */}
      <div className="tabs-container">
        <h2 className="tabs-title">Block Management</h2>
        <div className="tabs-row">
          <button className="tab-button" onClick={() => navigate('/superadmin/add-block')}>➕ Add New Block</button>
          <button className="tab-button" onClick={() => navigate('/superadmin/modify-block')}>✏️ Modify Block</button>
          <button className="tab-button active">🗑️ Remove Block</button>
        </div>
      </div>

      {/* Form */}
      <div className="form-area">
        <h3>🗑️ Remove Block</h3>
        <p>Permanently remove a block from the system.</p>

        {/* Block Dropdown */}
        <div className="form-grid">
          <select
            value={selectedBlock}
            onChange={(e) => {
              setSelectedBlock(e.target.value);
              setConfirmDelete(false);
              setMessage('');
              setError('');
            }}
            disabled={blocks.length === 0}
          >
            <option value="">{blocks.length === 0 ? 'Loading blocks...' : '-- Select a block --'}</option>
            {blocks.map((block) => (
              <option key={block._id} value={block._id}>
                {block.blockName}
                {Array.isArray(block.blockType) && block.blockType.length > 0
                  ? ` (${block.blockType.join(', ')})`
                  : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Step 1: Proceed button */}
        {selectedBlock && !confirmDelete && (
          <div className="bottom-buttons">
            <button
              className="cancel-btn"
              onClick={() => setSelectedBlock('')}
              disabled={loading}
              style={{ backgroundColor: 'white', color: 'black', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              className="delete-btn"
              onClick={() => setConfirmDelete(true)}
              disabled={loading}
              style={{ backgroundColor: '#cc0000', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
            >
              Proceed
            </button>
          </div>
        )}

        {/* Step 2: Final Confirmation Box */}
        {confirmDelete && (
          <div className="confirm-box" style={{ border: '2px solid red', background: '#ffecec', padding: '20px', marginTop: '20px', borderRadius: '8px' }}>
            <p style={{ color: '#cc0000', fontWeight: 'bold', fontSize: '16px' }}>
              ⚠️ Are you sure you want to remove this block?
            </p>
            <p>
              This will permanently delete <strong>"{getBlockNameById(selectedBlock)}"</strong> block and all associated rooms and data. This action cannot be undone.
            </p>
            <div className="bottom-buttons">
              <button
                className="delete-btn"
                onClick={handleRemoveBlock}
                disabled={loading}
                style={{ backgroundColor: '#cc0000', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
              >
                {loading ? 'Removing...' : 'Yes, Remove Block'}
              </button>
              <button
                className="cancel-btn"
                onClick={() => setConfirmDelete(false)}
                disabled={loading}
                style={{ backgroundColor: 'white', color: 'black', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Feedback */}
        {message && <p className="success" style={{ color: 'green', fontWeight: 'bold', marginTop: '10px' }}>{message}</p>}
        {error && <p className="error" style={{ color: 'red', fontWeight: 'bold', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );
};

export default RemoveBlock;
