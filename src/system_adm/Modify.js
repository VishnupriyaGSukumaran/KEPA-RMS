import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Modify.css';

const Modify = () => {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedBlockType, setSelectedBlockType] = useState('');
  const [roomTypeDetails, setRoomTypeDetails] = useState([]);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editedRoom, setEditedRoom] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBlocks();
  }, []);

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

  const refreshSelectedBlock = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/block/${selectedBlock._id}`);
      const data = await res.json();
      setSelectedBlock(data);
      if (selectedBlockType) {
        const selectedTypeDetails = data.blockTypeDetails.find(bt => bt.type === selectedBlockType);
        setRoomTypeDetails(selectedTypeDetails?.rooms || []);
      }
    } catch (err) {
      console.error('Error refreshing block:', err);
    }
  };

  const handleBlockSelect = async (e) => {
    const blockId = e.target.value;
    if (!blockId) {
      setSelectedBlock(null);
      setSelectedBlockType('');
      setRoomTypeDetails([]);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/block/${blockId}`);
      const data = await res.json();
      setSelectedBlock(data);
      setSelectedBlockType('');
      setRoomTypeDetails([]);
    } catch (error) {
      console.error('Failed to load block details:', error);
      setError('Failed to load block details');
    }
  };

  const handleBlockTypeSelect = (e) => {
    const type = e.target.value;
    setSelectedBlockType(type);
    const selectedTypeDetails = selectedBlock.blockTypeDetails.find(bt => bt.type === type);
    setRoomTypeDetails(selectedTypeDetails?.rooms || []);
  };

  const removeBlockType = async (type) => {
    try {
      const res = await fetch(`http://localhost:5000/api/block/${selectedBlock._id}/type/${type}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete block type');
      alert(`Block type ${type} removed.`);
      await refreshSelectedBlock();
      fetchBlocks();
    } catch (err) {
      console.error(err);
      alert('Error removing block type.');
    }
  };

  const addBlockType = async () => {
    const newType = prompt('Enter new block type name (Room, Dormitory, Suite Room, Barrack):');
    if (!newType) return;

    try {
      const res = await fetch(`http://localhost:5000/api/block/${selectedBlock._id}/type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newType })
      });
      if (!res.ok) throw new Error('Failed to add block type');
      alert(`Block type ${newType} added.`);
      await refreshSelectedBlock();
      fetchBlocks();
    } catch (err) {
      console.error(err);
      alert('Error adding block type.');
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoomId(room._id);
    setEditedRoom({ ...room });
  };

  const handleCancelEdit = () => {
    setEditingRoomId(null);
    setEditedRoom({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditedRoom({
      ...editedRoom,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSaveRoom = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/room/${editingRoomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedRoom)
      });
      if (!res.ok) throw new Error('Update failed');
      alert('Room updated successfully');
      setEditingRoomId(null);
      setEditedRoom({});
      await refreshSelectedBlock();
    } catch (err) {
      console.error(err);
      alert('Error updating room');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/room/${roomId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete room');
      alert('Room deleted successfully.');
      await refreshSelectedBlock();
    } catch (err) {
      console.error(err);
      alert('Error deleting room.');
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

      <div className="form-container">
        <h3 className="form-title">📝 Modify Block</h3>
        {error && <p className="error-text">{error}</p>}

        <label className="dropdown-label">Select Block</label>
        <select onChange={handleBlockSelect} defaultValue="" className="dropdown-select">
          <option value="">-- Choose Block --</option>
          {blocks.map(block => (
            <option key={block._id} value={block._id}>{block.blockName}</option>
          ))}
        </select>

        {selectedBlock && (
          <>
            <h4 className="room-heading">Room Types in {selectedBlock.blockName}</h4>
            <ul>
              {selectedBlock.blockTypeDetails.map(detail => (
                <li key={detail.type}>
                  {detail.type}: {detail.count}
                  <button onClick={() => removeBlockType(detail.type)}>❌ Remove</button>
                </li>
              ))}
            </ul>

            <div className="button-container">
              <button className="add-block-btn" onClick={addBlockType}>➕ Add Block Type</button>
            </div>

            <label className="center-label">Select Block Type to Modify</label>
            <select onChange={handleBlockTypeSelect} defaultValue="" className="dropdown-select">
              <option value="">-- Choose Type --</option>
              {selectedBlock.blockTypeDetails.map(detail => (
                <option key={detail.type} value={detail.type}>{detail.type}</option>
              ))}
            </select>
          </>
        )}

        {selectedBlockType && roomTypeDetails.length > 0 && (
          <div>
            <h4>Rooms under {selectedBlockType}</h4>
            <table className="room-table">
              <thead>
                <tr>
                  <th>Room Name</th>
                  <th>Floor</th>
                  <th>Beds</th>
                  <th>AC</th>
                  <th>Bathroom</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roomTypeDetails.map(room => (
                  <tr key={room._id}>
                    {editingRoomId === room._id ? (
                      <>
                        <td><input name="roomName" value={editedRoom.roomName} onChange={handleInputChange} /></td>
                        <td><input name="floorNumber" value={editedRoom.floorNumber} onChange={handleInputChange} /></td>
                        <td><input name="bedCount" value={editedRoom.bedCount} onChange={handleInputChange} /></td>
                        <td><input type="checkbox" name="isAC" checked={editedRoom.isAC} onChange={handleInputChange} /></td>
                        <td><input type="checkbox" name="attachedBathroom" checked={editedRoom.attachedBathroom} onChange={handleInputChange} /></td>
                        <td>
                          <button className="save-btn" onClick={handleSaveRoom}>Save</button>
                          <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
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
                          <button className="edit-btn" onClick={() => handleEditRoom(room)}>Edit</button>
                          <button className="delete-btn" onClick={() => handleDeleteRoom(room._id)}>Delete</button>
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
