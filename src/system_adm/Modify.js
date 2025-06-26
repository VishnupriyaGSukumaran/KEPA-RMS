import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Modify.css';

const predefinedTypes = ['SUITEROOM', 'ROOM', 'DORMITORY', 'BARRACK'];

const Modify = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef();
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedBlockType, setSelectedBlockType] = useState('');
  const [roomTypeDetails, setRoomTypeDetails] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
const [editRoomId, setEditRoomId] = useState(null);
const [editedRoomData, setEditedRoomData] = useState({});

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedTypesToAdd, setSelectedTypesToAdd] = useState([]);
  const [roomCounts, setRoomCounts] = useState({});

  useEffect(() => {
    fetchBlocks();
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/block');
      const data = await res.json();
      if (res.ok) setBlocks(data);
      else setError('Failed to load blocks');
    } catch (err) {
      setError('Server error while fetching blocks');
    }
    setLoading(false);
  };

  const handleBlockSelect = async (e) => {
    const blockId = e.target.value;
    if (!blockId) {
      setSelectedBlock(null);
      setSelectedBlockType('');
      setRoomTypeDetails([]);
      setSelectedTypesToAdd([]);
      setRoomCounts({});
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/block/${blockId}`);
      const data = await res.json();
      setSelectedBlock(data);
      setSelectedBlockType('');
      setRoomTypeDetails([]);
      setSelectedTypesToAdd([]);
      setRoomCounts({});
      setMessage('');
      setError('');
    } catch (error) {
      setError('Failed to load block details');
    }
  };

  const handleBlockTypeSelect = (e) => {
    const type = e.target.value;
    setSelectedBlockType(type);
    const selectedTypeDetails = selectedBlock.blockTypeDetails.find(
      (bt) => bt.type === type
    );
    setRoomTypeDetails(selectedTypeDetails?.rooms || []);
    setMessage('');
    setError('');
  };

  const removeBlockType = async (type) => {
    try {
      const res = await fetch(`http://localhost:5000/api/block/${selectedBlock._id}/type/${type}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete block type');
      setMessage(`Block type ${type} removed.`);
      setMessageType('success');
      handleBlockSelect({ target: { value: selectedBlock._id } });
    } catch (err) {
      setMessage('Error removing block type.');
      setMessageType('error');
    }
  };

  const availableTypes = selectedBlock
    ? predefinedTypes.filter(
        type => !selectedBlock.blockTypeDetails.some(detail => detail.type === type)
      )
    : [];

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleCheckboxChange = (type) => {
    let updatedSelected = [...selectedTypesToAdd];
    if (type === 'ALL') {
      if (selectedTypesToAdd.length === availableTypes.length) {
        updatedSelected = [];
      } else {
        updatedSelected = [...availableTypes];
      }
    } else {
      if (updatedSelected.includes(type)) {
        updatedSelected = updatedSelected.filter(t => t !== type);
      } else {
        updatedSelected.push(type);
      }
    }
    setSelectedTypesToAdd(updatedSelected);
    const updatedCounts = { ...roomCounts };
    updatedSelected.forEach(type => {
      if (!updatedCounts[type]) updatedCounts[type] = '';
    });
    setRoomCounts(updatedCounts);
  };

  const handleRoomCountChange = (type, value) => {
    setRoomCounts(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleCreateMultipleRooms = async () => {
    for (const type of selectedTypesToAdd) {
      const count = parseInt(roomCounts[type]);
      if (!count || count <= 0) {
        setMessage(`Please enter a valid room count for ${type}.`);
        setMessageType('error');
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/block/${selectedBlock._id}/type`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            count,
            rooms: []
          })
        });
        if (!res.ok) throw new Error('Failed to create room type');
      } catch (err) {
        setMessage(`Error creating ${type}.`);
        setMessageType('error');
        return;
      }
    }

    setMessage('Block types added successfully.');
    setMessageType('success');
    setSelectedTypesToAdd([]);
    setRoomCounts({});
    handleBlockSelect({ target: { value: selectedBlock._id } });
  };
  
  const handleStartEdit = (room) => {
  setEditRoomId(String(room._id)); // ✅ Force as string
  setEditedRoomData({
  roomName: room.roomName,
  floorNumber: room.floorNumber,
  bedCount: room.bedCount,
  isAC: room.isAC,
  attachedBathroom: room.attachedBathroom,
  additionalFacilities: room.additionalFacilities || {},
  blockName: selectedBlock.blockName,       // ✅ Add this
  roomType: selectedBlockType,              // ✅ Add this
  showFacilityInput: false,
  newFacility: ''
});

};

     const handleSaveEdit = async (roomId) => {

 console.log('Trying to save edit for room ID:', roomId); // Add this line

  if (!roomId) {
    setMessage('Room ID is missing.');
    setMessageType('error');
    return;
  }


  try {
    const res = await fetch(`http://localhost:5000/api/room/${roomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editedRoomData)
    });

    if (!res.ok) throw new Error('Update failed');
    setMessage('Room updated successfully.');
    setMessageType('success');
     // ✅ Exit edit mode
    setEditRoomId(null);
    setEditedRoomData({});
     // ✅ Refresh room data under the block type
    handleBlockTypeSelect({ target: { value: selectedBlockType } }); // Refresh data
  } catch (err) {
    setMessage('Failed to update room.');
    setMessageType('error');
  }
};
 const handleEditInputChange = (field, value) => {
  setEditedRoomData(prev => ({
    ...prev,
    [field]: value
  }));
};

 

  const handleDeleteRoom = async (roomId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/room/${roomId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete room');
      setMessage('Room deleted successfully.');
      setMessageType('success');
      handleBlockTypeSelect({ target: { value: selectedBlockType } });
    } catch (err) {
      setMessage('Error deleting room.');
      setMessageType('error');
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
        {error && <p className="error-text">{error}</p>}
        {message && <div className={`message-box ${messageType}`}>{message}</div>}
        {loading && <p className="loading-text">Loading blocks...</p>}

        <label className="dropdown-label">Select Block</label>
        <select onChange={handleBlockSelect} value={selectedBlock?._id || ''} className="dropdown-select">
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

            {availableTypes.length > 0 && (
              <div className="custom-multiselect" ref={dropdownRef}>
                <div className="custom-select-header" onClick={toggleDropdown}>
                  Select Block Types <span>{dropdownOpen ? '▲' : '▼'}</span>
                </div>
                {dropdownOpen && (
                  <div className="custom-select-options">
                    <label><input
                      type="checkbox"
                      checked={selectedTypesToAdd.length === availableTypes.length}
                      onChange={() => handleCheckboxChange('ALL')}
                    /> Select All</label>
                    {availableTypes.map(type => (
                      <label key={type}>
                        <input
                          type="checkbox"
                          checked={selectedTypesToAdd.includes(type)}
                          onChange={() => handleCheckboxChange(type)}
                        /> {type.charAt(0) + type.slice(1).toLowerCase()}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTypesToAdd.map(type => (
              <div key={type} className="count-input-group">
                <label>Enter Room Count for {type}</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={roomCounts[type] || ''}
                  onChange={e => handleRoomCountChange(type, e.target.value)}
                  className="input-count"
                />
              </div>
            ))}
{selectedTypesToAdd.length > 0 &&  Object.values(roomCounts).every(c => c !== '' && !isNaN(c)) &&  (
  <div className="create-room-wrapper">
    <button className="create-room-btn" onClick={handleCreateMultipleRooms}>
      Create Rooms
    </button>
  </div>
)}

           
            <br />
            <label className="center-label">Select Block Type to Modify</label>
            <select value={selectedBlockType} onChange={handleBlockTypeSelect} className="dropdown-select">
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
                  <th>Facilities</th>
                  <th>Actions</th>
                </tr>
              </thead>
             <tbody>
  {roomTypeDetails.map((room) => (
    <tr key={room._id}>
      <td>
        {editRoomId === room._id ? (
          <input
            value={editedRoomData.roomName}
            onChange={(e) => handleEditInputChange('roomName', e.target.value)}
          />
        ) : (
          room.roomName
        )}
      </td>
      <td>
        {editRoomId === room._id ? (
          <input
            type="number"
            value={editedRoomData.floorNumber}
            onChange={(e) => handleEditInputChange('floorNumber', e.target.value)}
          />
        ) : (
          room.floorNumber
        )}
      </td>
      <td>
        {editRoomId === room._id ? (
          <input
            type="number"
            value={editedRoomData.bedCount}
            onChange={(e) => handleEditInputChange('bedCount', e.target.value)}
          />
        ) : (
          room.bedCount
        )}
      </td>
      <td>
        {editRoomId === room._id ? (
          <select
  value={String(editedRoomData.isAC)}
  onChange={(e) => handleEditInputChange('isAC', e.target.value === 'true')}
>
  <option value="true">Yes</option>
  <option value="false">No</option>
</select>

        ) : room.isAC ? 'Yes' : 'No'}
      </td>
      <td>
        {editRoomId === room._id ? (
          <select
  value={String(editedRoomData.attachedBathroom)}
  onChange={(e) => handleEditInputChange('attachedBathroom', e.target.value === 'true')}
>
  <option value="true">Yes</option>
  <option value="false">No</option>
</select>

        ) : room.attachedBathroom ? 'Yes' : 'No'}
      </td>
      <td>
        {editRoomId === room._id ? (
          <div className="facility-edit-box">
  
    {Object.keys(editedRoomData.additionalFacilities || {}).map((facility) => (
  <span key={facility} className="facility-chip">{facility}</span>
))}

  {!editedRoomData.showFacilityInput && (
    <button
      className="facility-add-btn"
      onClick={() => {
        setEditedRoomData(prev => ({
          ...prev,
          showFacilityInput: true  // 👈 show the textbox
        }));
      }}
    >
      ➕
    </button>
  )}

  {editedRoomData.showFacilityInput && (
    <>
      <input
        type="text"
        placeholder="Add facility"
        value={editedRoomData.newFacility}
        onChange={(e) => handleEditInputChange('newFacility', e.target.value)}
        className="facility-input"
      />
      <button
        className="facility-confirm-btn"
        onClick={() => {
          const newKey = editedRoomData.newFacility?.trim();
          if (newKey) {
            setEditedRoomData(prev => ({
              ...prev,
              additionalFacilities: {
                ...prev.additionalFacilities,
                [newKey]: true
              },
              newFacility: '',
              showFacilityInput: false  // 👈 hide after adding
            }));
          }
        }}
      >
        ✅
      </button>
    </>
  )}
</div>

        ) : (
          Object.keys(room.additionalFacilities || {}).length > 0
            ? Object.keys(room.additionalFacilities).join(', ')
            : '—'
        )}
      </td>
      <td>
        {String(editRoomId) === String(room._id) ? (
  room._id ? (
    <button onClick={() => handleSaveEdit(room._id)}>✅ OK</button>
  ) : (
    <span style={{ color: 'red' }}>Invalid ID</span>
  )
) : (
  <>
    <button onClick={() => handleStartEdit(room)}>✏️ Edit</button>
    <button onClick={() => handleDeleteRoom(room._id)}>🗑️ Delete</button>
  </>
)}


      </td>
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
