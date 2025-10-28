import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Modify.css';

const Modify = () => {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [blockTypes, setBlockTypes] = useState([]);
  const [selectedBlockType, setSelectedBlockType] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingBlockType, setEditingBlockType] = useState(null);
  const [newBlockTypeName, setNewBlockTypeName] = useState('');
   // Add new state for room editing
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomEditForm, setRoomEditForm] = useState({
    roomName: '',
    floorNumber: '',
    bedCount: '',
    isAC: false,
    attachedBathroom: false,
    additionalFacilities: {}
  });

  // Normalize type names for consistent comparison
  const normalizeType = (type) => type.trim().replace(/\s+/g, '').toLowerCase();

  // Fetch all blocks
  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:5000/api/block');
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Expected JSON but got: ${text.substring(0, 100)}...`);
        }
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to fetch blocks');
        }
        
        const data = await res.json();
        setBlocks(data);
        setError('');
      } catch (err) {
        console.error('Error fetching blocks:', err);
        setError(err.message || 'Failed to load blocks');
      } finally {
        setLoading(false);
      }
    };
    fetchBlocks();
  }, []);

  // Fetch block details
  useEffect(() => {
    if (selectedBlock) {
      const fetchBlockDetails = async () => {
        try {
          setLoading(true);
          const res = await fetch(`http://localhost:5000/api/block/${selectedBlock._id}`);
          if (!res.ok) throw new Error('Failed to fetch block details');
          const data = await res.json();
          setBlockTypes(data.blockTypeDetails || []);
          setSelectedBlockType(null);
          setRooms([]);
          setError('');
        } catch (err) {
          console.error('Error fetching block details:', err);
          setError('Failed to load block details');
        } finally {
          setLoading(false);
        }
      };
      fetchBlockDetails();
    }
  }, [selectedBlock]);

  // Fetch rooms when type selected
  useEffect(() => {
    if (selectedBlock && selectedBlockType) {
      const fetchRooms = async () => {
        try {
          setLoading(true);
          const res = await fetch(
            `http://localhost:5000/api/room?blockId=${selectedBlock._id}&roomType=${encodeURIComponent(selectedBlockType.type)}`
          );
          if (!res.ok) throw new Error('Failed to fetch rooms');
          const data = await res.json();
          setRooms(data);
          setError('');
        } catch (err) {
          console.error('Error fetching rooms:', err);
          setError('Failed to load rooms');
        } finally {
          setLoading(false);
        }
      };
      fetchRooms();
    }
  }, [selectedBlock, selectedBlockType]);

  const handleDeleteBlockType = async (roomType) => {
    if (!selectedBlock) return;

    if (!window.confirm(`Are you sure you want to delete "${roomType}" and all its rooms?`)) {
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/block/${selectedBlock._id}/type/${encodeURIComponent(roomType)}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete block type');
      }

      // Refresh all data
      const refreshedBlock = await fetch(`http://localhost:5000/api/block/${selectedBlock._id}`);
      const blockData = await refreshedBlock.json();
      setBlockTypes(blockData.blockTypeDetails || []);
      setSelectedBlockType(null);
      setRooms([]);
      alert(`"${roomType}" deleted successfully`);
    } catch (err) {
      console.error('Error deleting block type:', err);
      alert(err.message || 'Failed to delete block type');
    }
  };

  const handleEditBlockType = (type) => {
    setEditingBlockType(type);
    setNewBlockTypeName(type.type);
  };

  const handleUpdateBlockType = async () => {
    if (!selectedBlock || !editingBlockType || !newBlockTypeName.trim()) return;
    
    try {
      // Format the type name according to backend expectations
      let formattedType = newBlockTypeName.trim();
      const normalizedNewType = normalizeType(newBlockTypeName);
      
      // Map to enum values if needed
      if (normalizedNewType === 'suiteroom') formattedType = 'Suite Room';
      if (normalizedNewType === 'barrack') formattedType = 'Barrack';
      if (normalizedNewType === 'dormitory') formattedType = 'Dormitory';
      if (normalizedNewType === 'room') formattedType = 'Room';

      const res = await fetch(
        `http://localhost:5000/api/block/${selectedBlock._id}/type/${encodeURIComponent(editingBlockType.type)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            newType: formattedType,
            count: editingBlockType.count 
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update block type');
      }

      // Refresh all data - block types and rooms
      const refreshedBlock = await fetch(`http://localhost:5000/api/block/${selectedBlock._id}`);
      const blockData = await refreshedBlock.json();
      setBlockTypes(blockData.blockTypeDetails || []);

      // If we were viewing the renamed type, refresh its rooms
      if (selectedBlockType && normalizeType(selectedBlockType.type) === normalizeType(editingBlockType.type)) {
        const roomsRes = await fetch(
          `http://localhost:5000/api/room?blockId=${selectedBlock._id}&roomType=${encodeURIComponent(formattedType)}`
        );
        const roomsData = await roomsRes.json();
        setRooms(roomsData);
        
        // Update selected type if it was the one being edited
        const updatedType = blockData.blockTypeDetails.find(
          t => normalizeType(t.type) === normalizeType(formattedType)
        );
        setSelectedBlockType(updatedType || null);
      }

      setEditingBlockType(null);
      setNewBlockTypeName('');
      alert('Block type updated successfully');
    } catch (err) {
      console.error('Error updating block type:', err);
      alert(err.message || 'Failed to update block type');
    }
  };
   // Handle edit room click
  const handleEditRoom = (room) => {
    setEditingRoom(room._id);
    setRoomEditForm({
      roomName: room.roomName,
      floorNumber: room.floorNumber,
      bedCount: room.bedCount,
      isAC: room.isAC,
      attachedBathroom: room.attachedBathroom,
      additionalFacilities: room.additionalFacilities || {}
    });
  };
    
  // Handle room edit form changes
  const handleRoomEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoomEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle facility edit changes
  const handleFacilityChange = (facilityKey, value) => {
    setRoomEditForm(prev => ({
      ...prev,
      additionalFacilities: {
        ...prev.additionalFacilities,
        [facilityKey]: value
      }
    }));
  };
   // Save edited room
  const handleSaveRoom = async () => {
    if (!selectedBlock || !selectedBlockType || !editingRoom) return;

    try {
      const res = await fetch(`http://localhost:5000/api/room/${editingRoom}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockId: selectedBlock._id,
          roomType: selectedBlockType.type,
          ...roomEditForm
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update room');
      }
      
      // Refresh rooms data
      const roomsRes = await fetch(
        `http://localhost:5000/api/room?blockId=${selectedBlock._id}&roomType=${encodeURIComponent(selectedBlockType.type)}`
      );
      const roomsData = await roomsRes.json();
      setRooms(roomsData);

      // Refresh block data to ensure consistency
      const blockRes = await fetch(`http://localhost:5000/api/block/${selectedBlock._id}`);
      const blockData = await blockRes.json();
      setBlockTypes(blockData.blockTypeDetails || []);

      setEditingRoom(null);
      alert('Room updated successfully');
    } catch (err) {
      console.error('Error updating room:', err);
      alert(err.message || 'Failed to update room');
    }
  };

  
  // Delete a room
  const handleDeleteRoom = async (roomId) => {
    if (!selectedBlock || !selectedBlockType || !window.confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/room/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockId: selectedBlock._id,
          roomType: selectedBlockType.type
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete room');
      }
      
      // Refresh rooms data
      const roomsRes = await fetch(
        `http://localhost:5000/api/room?blockId=${selectedBlock._id}&roomType=${encodeURIComponent(selectedBlockType.type)}`
      );
      const roomsData = await roomsRes.json();
      setRooms(roomsData);

      // Refresh block data to ensure consistency
      const blockRes = await fetch(`http://localhost:5000/api/block/${selectedBlock._id}`);
      const blockData = await blockRes.json();
      setBlockTypes(blockData.blockTypeDetails || []);

      alert('Room deleted successfully');
    } catch (err) {
      console.error('Error deleting room:', err);
      alert(err.message || 'Failed to delete room');
    }
  };
  return (
    <div className="block-page">
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

        {error && <div className="error-message">{error}</div>}
        {loading && <div className="loading-message">Loading...</div>}

        {/* Block Selection */}
        <div className="selection-section">
          <h4>Select Block</h4>
          <select
            className="form-select"
            value={selectedBlock?._id || ''}
            onChange={(e) => {
              const block = blocks.find(b => b._id === e.target.value);
              setSelectedBlock(block || null);
            }}
          >
            <option value="">-- Select Block --</option>
            {blocks.map(block => (
              <option key={block._id} value={block._id}>{block.blockName}</option>
            ))}
          </select>
        </div>

        {/* Block Types Section */}
        {selectedBlock && blockTypes.length > 0 && (
          <div className="selection-section">
            <h4>Room Types in {selectedBlock.blockName}</h4>
            <div className="block-types-list">
                   {blockTypes.map(type => (
  <div key={type.type} className="block-type-item">
    {editingBlockType?.type === type.type ? (
      <div className="edit-type-container">
        <input
          type="text"
          value={newBlockTypeName}
          onChange={(e) => setNewBlockTypeName(e.target.value)}
          className="edit-type-input"
        />
        <span className="room-count-display">Count: {type.count}</span>
        <button 
          onClick={handleUpdateBlockType}
          className="save-type-btn"
        >
          Save
        </button>
        <button 
          onClick={() => setEditingBlockType(null)}
          className="cancel-type-btn"
        >
          Cancel
        </button>
      </div>
    ) : (
      <>
        <span
          className={`block-type-name ${selectedBlockType?.type === type.type ? 'active' : ''}`}
          onClick={() => setSelectedBlockType(type)}
        >
          {type.type} ({type.count})
        </span>
        <div className="block-type-actions">
          <button
            className="edit-type-btn"
            onClick={() => handleEditBlockType(type)}
          >
            Edit
          </button>
          <button
            className="delete-type-btn"
            onClick={() => handleDeleteBlockType(type.type)}
          >
            Remove
          </button>
        </div>
      </>
    )}
  </div>
))}
            </div>
          </div>
        )}
            {/* Block Type Selection Dropdown */}
<div className="type-select-wrapper">
  <label htmlFor="blockTypeSelect" className="dropdown-label">Select Room Type</label>
  <select
    id="blockTypeSelect"
    className="dropdown-select"
    value={selectedBlockType?.type || ''}
    onChange={(e) => {
      const selected = blockTypes.find(type => type.type === e.target.value);
      setSelectedBlockType(selected || null);
    }}
  >
    <option value="">-- Choose Room Type --</option>
    {blockTypes.map(type => (
      <option key={type.type} value={type.type}>{type.type}</option>
    ))}
  </select>
</div>
 
        {/* Rooms Table */}
                      
  {selectedBlockType && (
    <div className="rooms-section">
      <h4>Rooms under {selectedBlockType.type}</h4>
      <table className="rooms-table">
        <thead>
          <tr>
            <th>Room Name</th>
            <th>Floor</th>
            <th>Beds</th>
            <th>AC</th>
            <th>Bathroom</th>
            <th>Facilities</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map(room => (
            <tr key={room._id}>
              {editingRoom === room._id ? (
                <>
                  <td>
                    <input
                      type="text"
                      name="roomName"
                      value={roomEditForm.roomName}
                      onChange={handleRoomEditChange}
                      className="edit-input"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="floorNumber"
                      value={roomEditForm.floorNumber}
                      onChange={handleRoomEditChange}
                      className="edit-input"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="bedCount"
                      value={roomEditForm.bedCount}
                      onChange={handleRoomEditChange}
                      className="edit-input"
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      name="isAC"
                      checked={roomEditForm.isAC}
                      onChange={handleRoomEditChange}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      name="attachedBathroom"
                      checked={roomEditForm.attachedBathroom}
                      onChange={handleRoomEditChange}
                    />
                  </td>
                  <td>
                    {Object.entries(roomEditForm.additionalFacilities).map(([key, value]) => (
                      <div key={key} className="facility-edit">
                        <span>{key}:</span>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleFacilityChange(key, e.target.value)}
                          className="facility-input"
                        />
                      </div>
                    ))}
                  </td>
                  <td>
                    <button onClick={handleSaveRoom} className="save-btn">
                      Save
                    </button>
                    <button 
                      onClick={() => setEditingRoom(null)} 
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td>{room.roomName}</td>
                  <td>{room.floorNumber}</td>
                  <td>{room.bedCount}</td>
                  <td>{room.isAC ? 'Yes' : 'No'}</td>
                  <td>{room.attachedBathroom ? 'Yes' : 'No'}</td>
                  <td>
                    {room.additionalFacilities ? (
                      <ul className="facilities-list">
                        {Object.entries(room.additionalFacilities).map(([key, value]) => (
                          <li key={key}>
                            {key}: {value.toString()}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleEditRoom(room)}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room._id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
      </div>
    </div>
  );
};

export default Modify;
