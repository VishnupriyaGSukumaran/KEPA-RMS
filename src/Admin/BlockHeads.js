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

  useEffect(() => {
    fetchBlockHeads();
  }, []);

  const fetchBlockHeads = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/blockheads');
      console.log("Fetched block heads:", res.data); 
      setBlockHeads(res.data);
    } catch (error) {
      console.error('Error fetching block heads:', error);
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

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

    try {
      if (isEditing && formData.id) {
        await axios.put(`http://localhost:5000/api/blockheads/${formData.id}`, payload);
        toast.success("Block head updated successfully");
      } else {
        await axios.post('http://localhost:5000/api/blockheads', payload);
        toast.success("Block head saved successfully");
      }

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
      console.error('Error saving block head:', error);
      if (error.response && error.response.status === 400) {
        toast.error("Block head with this PEN number already exists!");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

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
        <span style={{ wordBreak: 'break-word' }}>
          {params.value || '-'}
        </span>
      ),
    },
    { field: 'block', headerName: 'Block', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <>
          <Button
            variant="text"
            size="small"
            onClick={() => handleEdit(params.row)}
            style={{ color: '#1976d2' }}
          >
            Edit
          </Button>
          |
          <Button
            variant="text"
            size="small"
            onClick={() => handleDelete(params.row.id)}
            style={{ color: '#d32f2f' }}
          >
            Remove
          </Button>
        </>
      ),
    },
  ];

  // Prepare rows (make sure each row has an `id` field)
  const rows = blockHeads.map((head, index) => ({
    id: head._id,
    name: head.name,
    penNumber: head.penNumber,
    designation: head.designation,
    contact: head.contact,
    email: head.email || '-',
    block: head.block,
  }));

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/blockheads/${id}`);
      fetchBlockHeads();
      toast.success("Block head deleted");
    } catch (error) {
      console.error('Error deleting block head:', error);
      toast.error("Error deleting block head");
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
      id: head._id
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleBackClick = () => {
    navigate("/admin/dashboard");
  };

  const handleHomeClick = () => {
    navigate("/");
  };

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
          <div className="top-button" onClick={handleHomeClick}>
            <FaHome className="home-icon" /> Home
          </div>
        </div>
      </div>

      <div className="blockheads-header">
        <h2>Block Heads Management</h2>
        <button className="add-btn" onClick={handleAddClick}>+ Add Block Head</button>
      </div>

      {/* <div className="grid-container">
        <div className="grid-row grid-header">
          <div>Name</div>
          <div>PEN No</div>
          <div>Designation</div>
          <div>Contact</div>
          <div>Email</div>
          <div>Block</div>
          <div>Actions</div>
        </div>
        {blockHeads.map((head) => (
          <div className="grid-row" key={head._id}>
            <div>{head.name}</div>
            <div>{head.penNumber}</div>
            <div>{head.designation}</div>
            <div>{head.contact}</div>
            <div style={{ wordBreak: 'break-all' }}>{head.email || '-'}</div>
            <div>{head.block}</div>
            <div>
              <span className="edit-link" onClick={() => handleEdit(head)}>Edit</span>
              &nbsp;|&nbsp;
              <span className="remove-link" onClick={() => handleDelete(head._id)}>Remove</span>
            </div>
          </div>
        ))}
      </div> */}
      <div style={{ height: 500, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={8}
        rowsPerPageOptions={[8, 16, 32]}
        disableRowSelectionOnClick
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

      {/* ✅ Toast messages appear here */}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </div>
  );
}

export default BlockHeads;
