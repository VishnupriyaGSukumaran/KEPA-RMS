import { useState, useEffect } from 'react';

import './Modify.css';
import BlockManagementTabs from './BlockManagementTabs';
import { useNavigate, useLocation } from 'react-router-dom';
const Modify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [blockTypes, setBlockTypes] = useState([]);
  const [selectedBlockType, setSelectedBlockType] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingBlockType, setEditingBlockType] = useState(null);
  const [newBlockTypeName, setNewBlockTypeName] = useState('');
  // Room editing state
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomEditForm, setRoomEditForm] = useState({
    roomName: '',
    floorNumber: '',
    bedCount: '',
    isAC: false,
    attachedBathroom: false,
    additionalFacilities: {}
  });
  const [roomAllocationInfo, setRoomAllocationInfo] = useState({});
  const [editModalOpen, setEditModalOpen] = useState(false);

  // NEW: Add block type modal state
  const [addTypeModalOpen, setAddTypeModalOpen] = useState(false);
  const [newBlockType, setNewBlockType] = useState('');
  const [newTypeRoomCount, setNewTypeRoomCount] = useState('');
  
  // NEW: Change count modal state
  const [changeCountModalOpen, setChangeCountModalOpen] = useState(false);
  const [selectedTypeForCount, setSelectedTypeForCount] = useState(null);
  const [newRoomCount, setNewRoomCount] = useState('');

  const normalizeType = (type) => type.trim().replace(/\s+/g, '').toLowerCase();

  // Fetch all blocks
  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/block');
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format');
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

 
// ========================================
// OPTIMIZED useEffect for block selection
// ========================================

useEffect(() => {
  if (selectedBlock) {
    // Reset state immediately for better UX
    setBlockTypes([]);
    setSelectedBlockType(null);
    setRooms([]);
    setRoomAllocationInfo({});
    
    // Then fetch details
    fetchBlockDetails();
  } else {
    // Clear everything when no block selected
    setBlockTypes([]);
    setSelectedBlockType(null);
    setRooms([]);
    setRoomAllocationInfo({});
  }
}, [selectedBlock]);

// ========================================
// OPTIMIZED visibility change handler
// Remove the separate useEffect and merge into one
// ========================================

useEffect(() => {
  // Only set up listeners if a block is selected
  if (!selectedBlock) return;

  let refreshTimeout;

  const handleVisibilityChange = () => {
    if (!document.hidden && selectedBlock) {
      console.log('🔄 Page became visible, scheduling refresh...');
      // Debounce refresh to avoid multiple calls
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        fetchBlockDetails();
      }, 300);
    }
  };

  const handleFocus = () => {
    if (selectedBlock) {
      console.log('🔄 Window focused, scheduling refresh...');
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        fetchBlockDetails();
      }, 300);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);

  return () => {
    clearTimeout(refreshTimeout);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
  };
}, [selectedBlock]); // Only re-attach when selectedBlock changes



// Add this useEffect at the top of your Modify component, after the existing useEffects

useEffect(() => {
  // Check if we're returning from room creation
  const navState = location.state;
  
  if (navState && navState.refreshBlock) {
    console.log('🔄 Detected return from room creation, refreshing...');
    
    // Find the block that was just updated
    const blockToSelect = blocks.find(b => 
      b._id === navState.refreshBlock || 
      b.blockName === navState.refreshBlockName
    );
    
    if (blockToSelect) {
      console.log(`📍 Auto-selecting block: ${blockToSelect.blockName}`);
      setSelectedBlock(blockToSelect);
      
      // Clear the navigation state to prevent repeated refreshes
      navigate(location.pathname, { replace: true, state: {} });
    }
  }
}, [location.state, blocks]);


const fetchBlockDetails = async () => {
  try {
    setLoading(true);
    setError(''); // Clear previous errors
    
    console.log(`🔄 Fetching block details for: ${selectedBlock.blockName} (ID: ${selectedBlock._id})`);
    
    // ✅ Use AbortController for request cancellation if user changes selection quickly
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const timestamp = Date.now();
    const res = await fetch(
      `http://localhost:5000/api/block/${selectedBlock._id}?t=${timestamp}`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to fetch block details');
    }
    
    const data = await res.json();
    
    console.log('📦 Block data received:', {
      blockName: data.blockName,
      blockTypes: data.blockTypes,
      blockTypeDetailsCount: data.blockTypeDetails?.length || 0,
      types: data.blockTypeDetails?.map(t => `${t.type}(${t.count})`) || []
    });
    
    // ✅ Ensure blockTypeDetails exists and is an array
    const blockTypes = Array.isArray(data.blockTypeDetails) ? data.blockTypeDetails : [];
    
    if (blockTypes.length === 0) {
      console.warn('⚠️ No block types found in response');
    } else {
      console.log(`✅ Loaded ${blockTypes.length} block types:`);
      blockTypes.forEach(type => {
        console.log(`   - ${type.type}: ${type.count} rooms (${type.rooms?.length || 0} actual)`);
      });
    }
    
    // ✅ OPTIMIZATION: Only set state once at the end
    setBlockTypes(blockTypes);
    setSelectedBlockType(null);
    setRooms([]);
    setRoomAllocationInfo({});
    
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('⚠️ Request was aborted (timeout or cancelled)');
      setError('Request timeout. Please try again.');
    } else {
      console.error('❌ Error fetching block details:', err);
      setError('Failed to load block details: ' + err.message);
    }
  } finally {
    setLoading(false);
  }
};

  // ✅ FIXED: Fetch rooms with complete allocation data
  useEffect(() => {
    if (selectedBlock && selectedBlockType) {
      fetchRoomsWithData();
    }
  }, [selectedBlock, selectedBlockType]);

  const fetchRoomsWithData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching rooms for type:', selectedBlockType.type);
      
      const res = await fetch(
        `http://localhost:5000/api/room?blockId=${selectedBlock._id}&roomType=${encodeURIComponent(selectedBlockType.type)}`
      );
      if (!res.ok) throw new Error('Failed to fetch rooms');
      const roomData = await res.json();
      console.log('📦 Rooms fetched:', roomData.length);
      setRooms(roomData);
      
      // Build allocation info from room data
      const allocationMap = {};
      
      roomData.forEach(room => {
        const beds = room.beds || [];
        const allocatedCount = beds.filter(b => b.status === 'allocated').length || room.allocatedBeds || 0;
        const bedCount = room.bedCount || 0;
        const vacantCount = bedCount - allocatedCount;
        
        let status = 'Vacant';
        if (allocatedCount > 0 && allocatedCount < bedCount) {
          status = 'Partially Allocated';
        } else if (allocatedCount >= bedCount && bedCount > 0) {
          status = 'Fully Allocated';
        }
        
        allocationMap[room._id] = {
          roomId: room._id,
          roomName: room.roomName,
          bedCount: bedCount,
          allocatedBeds: allocatedCount,
          vacantBeds: vacantCount,
          status: status,
          canEdit: allocatedCount === 0,
          canDelete: allocatedCount === 0,
          beds: beds
        };
      });
      
      setRoomAllocationInfo(allocationMap);
      setError('');
      
    } catch (err) {
      console.error('Error in fetchRoomsWithData:', err);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

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

      await fetchBlockDetails();
      setSelectedBlockType(null);
      setRooms([]);
      setRoomAllocationInfo({});
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
      let formattedType = newBlockTypeName.trim();
      const normalizedNewType = normalizeType(newBlockTypeName);
      
      if (normalizedNewType === 'suiteroom') formattedType = 'Suite Room';
      if (normalizedNewType === 'barrack') formattedType = 'Barrack';
      if (normalizedNewType === 'dormitory') formattedType = 'Dormitory';
      if (normalizedNewType === 'room') formattedType = 'Room';

      const res = await fetch(
        `http://localhost:5000/api/block/${selectedBlock._id}/type/${encodeURIComponent(editingBlockType.type)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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

      await fetchBlockDetails();

      if (selectedBlockType && normalizeType(selectedBlockType.type) === normalizeType(editingBlockType.type)) {
        const updatedType = blockTypes.find(
          t => normalizeType(t.type) === normalizeType(formattedType)
        );
        setSelectedBlockType(updatedType || null);
        await fetchRoomsWithData();
      }

      setEditingBlockType(null);
      setNewBlockTypeName('');
      alert('Block type updated successfully');
    } catch (err) {
      console.error('Error updating block type:', err);
      alert(err.message || 'Failed to update block type');
    }
  };

  const handleEditRoom = (room) => {
    const allocInfo = roomAllocationInfo[room._id];
    
    if (!allocInfo) {
      alert('Room data not loaded. Please try again.');
      return;
    }
    
    const allocatedCount = allocInfo.allocatedBeds || 0;
    
    if (allocatedCount > 0) {
      alert(`Cannot edit this room.\n\nStatus: ${allocInfo.status}\nAllocated: ${allocatedCount}/${allocInfo.bedCount} beds\n\nPlease vacate all beds first.`);
      return;
    }
    
    setEditingRoom(room._id);
    setRoomEditForm({
      roomName: room.roomName,
      floorNumber: room.floorNumber,
      bedCount: room.bedCount,
      isAC: room.isAC,
      attachedBathroom: room.attachedBathroom,
      additionalFacilities: room.additionalFacilities || {}
    });
    setEditModalOpen(true);
  };
    
  const handleRoomEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoomEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFacilityChange = (facilityKey, value) => {
    setRoomEditForm(prev => ({
      ...prev,
      additionalFacilities: {
        ...prev.additionalFacilities,
        [facilityKey]: value
      }
    }));
  };

  const handleSaveRoom = async () => {
    if (!selectedBlock || !selectedBlockType || !editingRoom) return;

    try {
      const res = await fetch(`http://localhost:5000/api/room/${editingRoom}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      
      // ✅ FIX: Refresh data immediately after save
      await fetchBlockDetails();
      await fetchRoomsWithData();

      setEditingRoom(null);
      setEditModalOpen(false);
      alert('Room updated successfully');
    } catch (err) {
      console.error('Error updating room:', err);
      alert(err.message || 'Failed to update room');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!selectedBlock || !selectedBlockType) return;
    
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }

    const allocInfo = roomAllocationInfo[roomId];
    
    if (!allocInfo) {
      alert('Room data not loaded. Please try again.');
      return;
    }
    
    const allocatedCount = allocInfo.allocatedBeds || 0;
    
    if (allocatedCount > 0) {
      alert(`Cannot delete this room.\n\nStatus: ${allocInfo.status}\nAllocated: ${allocatedCount}/${allocInfo.bedCount} beds\n\nPlease vacate all beds first.`);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/room/${roomId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockId: selectedBlock._id,
          roomType: selectedBlockType.type
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete room');
      }
      
      // ✅ FIX: Refresh data immediately after delete
      await fetchBlockDetails();
      await fetchRoomsWithData();

      alert('Room deleted successfully');
    } catch (err) {
      console.error('Error deleting room:', err);
      alert(err.message || 'Failed to delete room');
    }
  };

  // ✅ NEW: Add Block Type Handler
  const handleAddBlockType = () => {
    setNewBlockType('');
    setNewTypeRoomCount('');
    setAddTypeModalOpen(true);
  };

  const handleSaveNewBlockType = async () => {
    if (!selectedBlock || !newBlockType.trim() || !newTypeRoomCount) {
      alert('Please fill all fields');
      return;
    }

    const count = parseInt(newTypeRoomCount);
    if (isNaN(count) || count <= 0) {
      alert('Please enter a valid positive number for room count');
      return;
    }

    try {
      let formattedType = newBlockType.trim();
      const normalized = normalizeType(newBlockType);
      
      if (normalized === 'suiteroom') formattedType = 'Suite Room';
      if (normalized === 'barrack') formattedType = 'Barrack';
      if (normalized === 'dormitory') formattedType = 'Dormitory';
      if (normalized === 'room') formattedType = 'Room';

      const res = await fetch(`http://localhost:5000/api/block/${selectedBlock._id}/type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: formattedType, count })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add block type');
      }

      await fetchBlockDetails();
      setAddTypeModalOpen(false);
      alert(`Block type "${formattedType}" added successfully. You can now create ${count} rooms for this type.`);
      
      // Navigate to create rooms
      navigate('/superadmin/createMODIFYrooms', {
        state: {
          blockId: selectedBlock._id,
          blockName: selectedBlock.blockName,
          roomType: formattedType,
          roomCount: count
        }
      });
    } catch (err) {
      console.error('Error adding block type:', err);
      alert(err.message || 'Failed to add block type');
    }
  };

  // ✅ NEW: Change Count Handler
  const handleChangeCount = (type) => {
    setSelectedTypeForCount(type);
    setNewRoomCount(type.count.toString());
    setChangeCountModalOpen(true);
  };

  const handleSaveNewCount = async () => {
    if (!selectedBlock || !selectedTypeForCount || !newRoomCount) {
      alert('Please fill all fields');
      return;
    }

    const count = parseInt(newRoomCount);
    if (isNaN(count) || count < 0) {
      alert('Please enter a valid non-negative number');
      return;
    }

    const currentCount = selectedTypeForCount.count;
    
    if (count < currentCount) {
      alert(`Cannot decrease room count. Current count: ${currentCount}. Please delete rooms manually first.`);
      return;
    }

    if (count === currentCount) {
      alert('New count is same as current count');
      setChangeCountModalOpen(false);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/block/${selectedBlock._id}/type/${encodeURIComponent(selectedTypeForCount.type)}/count`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newCount: count })
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update count');
      }

      await fetchBlockDetails();
      setChangeCountModalOpen(false);
      
      const additionalRooms = count - currentCount;
      alert(`Room count updated successfully. You need to create ${additionalRooms} more room(s).`);
      
      // Navigate to create additional rooms
      navigate('/superadmin/createMODIFYrooms', {
        state: {
          blockId: selectedBlock._id,
          blockName: selectedBlock.blockName,
          roomType: selectedTypeForCount.type,
          roomCount: additionalRooms,
          isAdditional: true
        }
      });
    } catch (err) {
      console.error('Error updating count:', err);
      alert(err.message || 'Failed to update room count');
    }
  };

  const getAllocationStatus = (roomId) => {
    const allocInfo = roomAllocationInfo[roomId];
    
    if (!allocInfo) {
      return { 
        text: 'Loading...', 
        color: '#6c757d', 
        icon: '⏳', 
        canEdit: false,
        occupied: 0,
        available: 0
      };
    }

    const status = allocInfo.status || 'Vacant';
    const allocated = allocInfo.allocatedBeds || 0;
    const vacant = allocInfo.vacantBeds || 0;
    const bedCount = allocInfo.bedCount || 0;

    switch (status) {
      case 'Vacant':
        return { 
          text: 'Vacant', 
          color: '#28a745', 
          icon: '✓', 
          canEdit: true,
          occupied: 0,
          available: bedCount
        };
      case 'Partially Allocated':
        return { 
          text: `Partially Allocated`, 
          color: '#ffc107', 
          icon: '⚠', 
          canEdit: false,
          occupied: allocated,
          available: vacant
        };
      case 'Fully Allocated':
        return { 
          text: `Fully Allocated`, 
          color: '#dc3545', 
          icon: '✕', 
          canEdit: false,
          occupied: allocated,
          available: 0
        };
      default:
        return { 
          text: 'Unknown', 
          color: '#6c757d', 
          icon: '?', 
          canEdit: false,
          occupied: 0,
          available: bedCount
        };
    }
  };

  return (
    <div className="block-page">
      <BlockManagementTabs activeTab="modify" />

      <div className="form-container">
        <h3 className="form-title">📝 Modify Block</h3>

        {error && <div className="error-message">{error}</div>}
        {loading && <div className="loading-message">Loading...</div>}

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

        {selectedBlock && blockTypes.length > 0 && (
          <div className="selection-section">
            <div className="section-header">
              <h4>Room Types in {selectedBlock.blockName}</h4>
              <button onClick={handleAddBlockType} className="add-type-btn">
                ➕ Add New Type
              </button>
            </div>
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
                      <button onClick={handleUpdateBlockType} className="save-type-btn">Save</button>
                      <button onClick={() => setEditingBlockType(null)} className="cancel-type-btn">Cancel</button>
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
                        <button className="change-count-btn" onClick={() => handleChangeCount(type)}>
                          Change Count
                        </button>
                        <button className="edit-type-btn" onClick={() => handleEditBlockType(type)}>
                          Edit
                        </button>
                        <button className="delete-type-btn" onClick={() => handleDeleteBlockType(type.type)}>
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
 
        {selectedBlockType && (
          <div className="rooms-section">
            <h4>Rooms under {selectedBlockType.type}</h4>
            {rooms.length === 0 ? (
              <p className="no-rooms-message">No rooms found for this room type.</p>
            ) : (
              <table className="rooms-table">
                <thead>
                  <tr>
                    <th>Room Name</th>
                    <th>Floor</th>
                    <th>Capacity</th>
                    <th>Occupied</th>
                    <th>Available</th>
                    <th>AC</th>
                    <th>Bathroom</th>
                    <th>Facilities</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(room => {
                    const status = getAllocationStatus(room._id);
                    const isDisabled = !status.canEdit;
                    
                    return (
                      <tr key={room._id} style={isDisabled && status.text !== 'Loading...' ? { backgroundColor: '#fff5f5' } : {}}>
                        <td><strong>{room.roomName}</strong></td>
                        <td>{room.floorNumber}</td>
                        <td>{room.bedCount}</td>
                        <td style={{ color: '#dc3545', fontWeight: 'bold' }}>{status.occupied}</td>
                        <td style={{ color: '#28a745', fontWeight: 'bold' }}>{status.available}</td>
                        <td>{room.isAC ? '✓' : '-'}</td>
                        <td>{room.attachedBathroom ? '✓' : '-'}</td>
                        <td>
                          {room.additionalFacilities && Object.keys(room.additionalFacilities).length > 0 ? (
                            <ul className="facilities-list">
                              {Object.entries(room.additionalFacilities).map(([key, value]) => (
                                <li key={key}>{key}: {value.toString()}</li>
                              ))}
                            </ul>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          <span className="status-badge" style={{ backgroundColor: status.color }} title={status.text}>
                            {status.icon} {status.text}
                          </span>
                        </td>
                        <td style={{ minWidth: '140px' }}>
                          <button
                            onClick={() => handleEditRoom(room)}
                            className={`edit-btn ${isDisabled ? 'disabled' : ''}`}
                            disabled={isDisabled}
                            title={isDisabled ? `Cannot edit - ${status.text}` : 'Edit room details'}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room._id)}
                            className={`delete-btn ${isDisabled ? 'disabled' : ''}`}
                            disabled={isDisabled}
                            title={isDisabled ? `Cannot delete - ${status.text}` : 'Delete room'}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Edit Room Modal */}
      {editModalOpen && editingRoom && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Room</h3>
              <button className="modal-close" onClick={() => setEditModalOpen(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Room Name</label>
                <input
                  type="text"
                  name="roomName"
                  value={roomEditForm.roomName}
                  onChange={handleRoomEditChange}
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Floor Number</label>
                  <input
                    type="number"
                    name="floorNumber"
                    value={roomEditForm.floorNumber}
                    onChange={handleRoomEditChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Bed Count</label>
                  <input
                    type="number"
                    name="bedCount"
                    value={roomEditForm.bedCount}
                    onChange={handleRoomEditChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="isAC"
                      checked={roomEditForm.isAC}
                      onChange={handleRoomEditChange}
                    />
                    AC Available
                  </label>
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="attachedBathroom"
                      checked={roomEditForm.attachedBathroom}
                      onChange={handleRoomEditChange}
                    />
                    Attached Bathroom
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Additional Facilities</label>
                {Object.keys(roomEditForm.additionalFacilities).length > 0 ? (
                  Object.entries(roomEditForm.additionalFacilities).map(([key, value]) => (
                    <div key={key} className="facility-edit">
                      <span className="facility-key">{key}:</span>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleFacilityChange(key, e.target.value)}
                        className="facility-input"
                      />
                    </div>
                  ))
                ) : (
                  <p className="no-facilities">No additional facilities</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={handleSaveRoom} className="save-btn">Save Changes</button>
              <button onClick={() => setEditModalOpen(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Block Type Modal */}
      {addTypeModalOpen && (
        <div className="modal-overlay" onClick={() => setAddTypeModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Block Type</h3>
              <button className="modal-close" onClick={() => setAddTypeModalOpen(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Block Type</label>
                <select
                  className="form-inputS"
                  value={newBlockType}
                  onChange={(e) => setNewBlockType(e.target.value)}
                >
                  <option value="">-- Select Type --</option>
                  <option value="Suite Room">Suite Room</option>
                  <option value="Room">Room</option>
                  <option value="Dormitory">Dormitory</option>
                  <option value="Barrack">Barrack</option>
                </select>
              </div>

              <div className="form-group">
                <label>Number of Rooms</label>
                <input
                  type="number"
                  min="1"
                  value={newTypeRoomCount}
                  onChange={(e) => setNewTypeRoomCount(e.target.value)}
                  className="form-input"
                  placeholder="Enter number of rooms"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={handleSaveNewBlockType} className="save-btn">Add Type</button>
              <button onClick={() => setAddTypeModalOpen(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Count Modal */}
      {changeCountModalOpen && selectedTypeForCount && (
        <div className="modal-overlay" onClick={() => setChangeCountModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Room Count</h3>
              <button className="modal-close" onClick={() => setChangeCountModalOpen(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Block Type: {selectedTypeForCount.type}</label>
                <p className="info-text">Current Count: {selectedTypeForCount.count}</p>
              </div>

              <div className="form-group">
                <label>New Room Count</label>
                <input
                  type="number"
                  min={selectedTypeForCount.count}
                  value={newRoomCount}
                  onChange={(e) => setNewRoomCount(e.target.value)}
                  className="form-input"
                  placeholder="Enter new count"
                />
                <p className="info-text">Note: You can only increase the count, not decrease it.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={handleSaveNewCount} className="save-btn">Update Count</button>
              <button onClick={() => setChangeCountModalOpen(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Modify;