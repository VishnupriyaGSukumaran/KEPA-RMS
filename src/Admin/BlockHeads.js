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
    name: '', penNumber: '', designation: '', contact: '', email: '', block: '', id: ''
  });

  useEffect(() => {
    fetchBlockHeads();
  }, []);

  const fetchBlockHeads = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/blockheads');
      setBlockHeads(res.data);
    } catch (error) {
      console.error('Fetch Error:', error);
    }
  };

  const handleAddClick = () => {
    setFormData({ name: '', penNumber: '', designation: '', contact: '', email: '', block: '', id: '' });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 const handleFormSubmit = async (e) => {
  e.preventDefault();

  // 🛡️ Validate required fields
  if (
    !formData.name ||
    !formData.penNumber ||
    !formData.designation ||
    !formData.contact ||
    !formData.email ||
    !formData.block
  ) {
    toast.warning("Please fill in all required fields");
    return;
  }

  const payload = {
    name: formData.name,
    penNumber: formData.penNumber,
    designation: formData.designation,
    contact: formData.contact,
    email: formData.email,
    block: formData.block
  };

  console.log("🟡 FORM PAYLOAD BEING SENT:", payload);

  try {
    if (isEditing && formData.id) {
      // ✅ Editing — use PUT
      await axios.put(`http://localhost:5000/api/blockheads/${formData.id}`, payload);
      toast.success("✅ Block head updated successfully");
    } else {
      // ➕ Creating new — use POST
      await axios.post('http://localhost:5000/api/blockheads', payload);
      toast.success("✅ Block head saved successfully");
    }

    // 🔄 Reset form
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
    fetchBlockHeads();
  } catch (error) {
    console.error("❌ FORM SUBMIT ERROR:", error?.response?.data || error);
    if (error.response && error.response.status === 400) {
      toast.error(error.response.data.message);
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  }
};


 const handleEdit = (head) => {
  setFormData({
    name: head.name,
    penNumber: head.penNumber,
    designation: head.designation,
    contact: head.contact,
    email: head.email || '',
    block: head.block,
    id: head.id || head._id   // ✅ Important!
  });
  setIsEditing(true);
  setShowForm(true);
};

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/blockheads/${id}`);
      fetchBlockHeads();
      toast.success("Deleted successfully");
    } catch (error) {
      toast.error("Error deleting");
    }
  };

  const handleBackClick = () => navigate("/admin/dashboard");
  const handleHomeClick = () => navigate("/");

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
        <>
          <Button onClick={() => handleEdit(params.row)} size="small" style={{ color: '#1976d2' }}>Edit</Button>
          |
          <Button onClick={() => handleDelete(params.row.id)} size="small" style={{ color: '#d32f2f' }}>Remove</Button>
        </>
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
      <div className="top-bar">
        <div className="top-left">
          <img src="/logo.png" alt="Logo" className="top-logo" />
          <div className="top-heading">
            <div className="main-title">RMS</div>
            <div className="sub-title">Kerala Police</div>
          </div>
          <div className="top-center">ADMIN</div>
        </div>
        <div className="top-right">
          <div className="top-button" onClick={handleBackClick}>🔙 Back</div>
          <div className="top-button" onClick={handleHomeClick}><FaHome /> Home</div>
        </div>
      </div>

      <div className="blockheads-header">
        <h2>Block Heads Management</h2>
        <button className="add-btn" onClick={handleAddClick}>+ Add Block Head</button>
      </div>

      <div style={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={8}
          rowsPerPageOptions={[8, 16, 32]}
          disableRowSelectionOnClick
          showToolbar
        />
      </div>

      {showForm && (
        <div className="modal">
          <form className="blockhead-form" onSubmit={handleFormSubmit}>
            <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} required />
            <input type="text" name="penNumber" placeholder="PEN Number" value={formData.penNumber} onChange={handleInputChange} required />
            <input type="text" name="designation" placeholder="Designation" value={formData.designation} onChange={handleInputChange} required />
            <input type="text" name="contact" placeholder="Contact" value={formData.contact} onChange={handleInputChange} required />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required />
            <input type="text" name="block" placeholder="Block Name" value={formData.block} onChange={handleInputChange} required />
            <button type="submit">{isEditing ? "Update" : "Save"}</button>
            <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </form>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </div>
  );
}

export default BlockHeads;
