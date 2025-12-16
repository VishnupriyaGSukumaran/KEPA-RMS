import React, { useState, useEffect } from 'react';
import './BlockHeads.css';
import { FaHome } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DataGrid } from '@mui/x-data-grid';
import { Button } from '@mui/material';

function BlockHeads() {
  const navigate = useNavigate();
  const [blockHeads, setBlockHeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '', 
    penNumber: '', 
    designation: '', 
    contact: '', 
    email: '', 
    block: '', 
    id: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBlockHeads();
  }, []);

  const fetchBlockHeads = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/blockheads');
      console.log('✅ Fetched Block Heads:', res.data);
      setBlockHeads(res.data);
    } catch (error) {
      console.error('❌ Fetch Error:', error);
      toast.error('Failed to load block heads');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setFormData({ 
      name: '', 
      penNumber: '', 
      designation: '', 
      contact: '', 
      email: '', 
      block: '', 
      id: '' 
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = ['name', 'penNumber', 'designation', 'contact', 'email', 'block'];
    const missingFields = requiredFields.filter(field => !formData[field]?.trim());

    if (missingFields.length > 0) {
      toast.warning(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.warning('Please enter a valid email address');
      return;
    }

    // Validate contact number (basic check)
    if (formData.contact.trim().length < 10) {
      toast.warning('Please enter a valid contact number');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      penNumber: formData.penNumber.trim(),
      designation: formData.designation.trim(),
      contact: formData.contact.trim(),
      email: formData.email.trim().toLowerCase(),
      block: formData.block.trim()
    };

    console.log('📤 Submitting payload:', payload);
    console.log('🔧 Is Editing:', isEditing);
    console.log('🆔 Form ID:', formData.id);

    try {
      setLoading(true);

      if (isEditing && formData.id) {
        // Update existing block head
        console.log('📝 Updating block head:', formData.id);
        const response = await axios.put(
          `http://localhost:5000/api/blockheads/${formData.id}`, 
          payload
        );
        console.log('✅ Update response:', response.data);
        toast.success('Block head updated successfully! Notification sent to Superadmin.');
      } else {
        // Create new block head
        console.log('➕ Creating new block head');
        const response = await axios.post(
          'http://localhost:5000/api/blockheads', 
          payload
        );
        console.log('✅ Create response:', response.data);
        toast.success('Block head added successfully! Notification sent to Superadmin.');
      }

      // Reset form and refresh data
      setShowForm(false);
      setFormData({
        name: '',
        penNumber: '',
        designation: '',
        contact: '',
        email: '',
        block: '',
        id: ''
      });
      setIsEditing(false);
      
      // Fetch updated list
      await fetchBlockHeads();

    } catch (error) {
      console.error('❌ Submit Error:', error);
      
      // Handle specific error messages from backend
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Something went wrong';
        
        if (error.response.status === 400) {
          toast.error(errorMessage);
        } else if (error.response.status === 404) {
          toast.error('Block head not found');
        } else {
          toast.error('Server error. Please try again.');
        }
      } else if (error.request) {
        toast.error('Cannot connect to server. Please check your connection.');
      } else {
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (head) => {
    console.log('✏️ Editing block head:', head);
    
    setFormData({
      name: head.name || '',
      penNumber: head.penNumber || '',
      designation: head.designation || '',
      contact: head.contact || '',
      email: head.email || '',
      block: head.block || '',
      id: head.id || head._id
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this block head?')) {
      return;
    }

    try {
      setLoading(true);
      console.log('🗑️ Deleting block head:', id);
      
      await axios.delete(`http://localhost:5000/api/blockheads/${id}`);
      
      toast.success('Block head deleted successfully! Notification sent to Superadmin.');
      await fetchBlockHeads();
    } catch (error) {
      console.error('❌ Delete Error:', error);
      
      if (error.response?.status === 404) {
        toast.error('Block head not found');
      } else {
        toast.error('Failed to delete block head');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => navigate("/admin/dashboard");

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'penNumber', headerName: 'PEN No', flex: 1 },
    { field: 'designation', headerName: 'Designation', flex: 1 },
    { field: 'contact', headerName: 'Contact', flex: 1 },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      renderCell: (params) => (
        <span style={{ wordBreak: 'break-word' }}>{params.value || '-'}</span>
      )
    },
    { field: 'block', headerName: 'Block', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            onClick={() => handleEdit(params.row)}
            size="small"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            Edit
          </Button>
          <Button
            onClick={() => handleDelete(params.row.id)}
            size="small"
            variant="contained"
            color="error"
            disabled={loading}
          >
            Remove
          </Button>
        </div>
      )
    }
  ];

  const rows = blockHeads.map(head => ({
    id: head._id,
    name: head.name,
    penNumber: head.penNumber,
    designation: head.designation,
    contact: head.contact,
    email: head.email || '-',
    block: head.block
  }));

  return (
    <div className="blockheads-wrapper">
      <div className="blockheads-page">
        {/* Header with Back Button, Heading, and Add Button in one row */}
        <div className="blockheads-header">
          <button className="back-buttonS" onClick={handleBackClick}>
            ← Back
          </button>
          
          <h2>Block Heads Management</h2>
          
          <button 
            className="add-btn" 
            onClick={handleAddClick}
            disabled={loading}
          >
            + Add Block Head
          </button>
        </div>

        {/* DataGrid */}
        <div style={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={8}
            rowsPerPageOptions={[8, 16, 32]}
            disableRowSelectionOnClick
            loading={loading}
          />
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="modal" onClick={() => setShowForm(false)}>
          <form 
            className="blockhead-form" 
            onSubmit={handleFormSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{isEditing ? 'Edit Block Head' : 'Add Block Head'}</h3>
            
            <input 
              type="text" 
              name="name" 
              placeholder="Full Name *" 
              value={formData.name} 
              onChange={handleInputChange} 
              required 
              disabled={loading}
            />
            
            <input 
              type="text" 
              name="penNumber" 
              placeholder="PEN Number *" 
              value={formData.penNumber} 
              onChange={handleInputChange} 
              required 
              disabled={loading}
            />
            
            <input 
              type="text" 
              name="designation" 
              placeholder="Designation *" 
              value={formData.designation} 
              onChange={handleInputChange} 
              required 
              disabled={loading}
            />
            
            <input 
              type="tel" 
              name="contact" 
              placeholder="Contact Number *" 
              value={formData.contact} 
              onChange={handleInputChange} 
              required 
              minLength="10"
              disabled={loading}
            />
            
            <input 
              type="email" 
              name="email" 
              placeholder="Email Address *" 
              value={formData.email} 
              onChange={handleInputChange} 
              required 
              disabled={loading}
            />
            
            <input 
              type="text" 
              name="block" 
              placeholder="Block Name *" 
              value={formData.block} 
              onChange={handleInputChange} 
              required 
              disabled={loading}
            />
            
            <div className="form-actions">
              <button 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Processing...' : (isEditing ? "Update" : "Save")}
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        theme="colored" 
        newestOnTop
      />
    </div>
  );
}

export default BlockHeads;