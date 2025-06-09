import React, { useState } from 'react';
import './BHAssign.css'; // Link to CSS file

const BHAssign = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [blockHeads, setBlockHeads] = useState([
    { id: 1, name: 'John Doe', penNo: '12345', block: 'A1' },
    { id: 2, name: 'Jane Smith', penNo: '67890', block: 'B2' },
  ]);

  const handleEdit = (id) => {
    console.log('Edit', id);
  };

  const handleRemove = (id) => {
    setBlockHeads(blockHeads.filter((head) => head.id !== id));
  };

  return (
    <div className="container">
      <aside className="sidebar">
        <h1 className="title">RAMS</h1>
        <p className="admin-user">Admin User<br /><span>admin@policeacademy.edu</span></p>
        <nav className="nav">
          <button>Dashboard</button>
          <div className="nav-section">MANAGEMENT</div>
          <button>Blocks & Rooms</button>
          <button className="active">Block heads</button>
          <button>Allocations</button>
          <button>Reports</button>
          <button>Notifications</button>
        </nav>
        <button className="logout">Logout</button>
      </aside>

      <main className="main-content">
        <div className="header">
          <h2>Block Heads Management</h2>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>PEN NO</th>
              <th>ASSIGNED BLOCK</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {blockHeads
              .filter((head) =>
                head.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((head) => (
                <tr key={head.id}>
                  <td>{head.name}</td>
                  <td>{head.penNo}</td>
                  <td>{head.block}</td>
                  <td>
                    <button className="edit" onClick={() => handleEdit(head.id)}>Edit</button>
                    <button className="remove" onClick={() => handleRemove(head.id)}>Remove</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default BHAssign;
