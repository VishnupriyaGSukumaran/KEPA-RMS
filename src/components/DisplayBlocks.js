import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DisplayBlocks.css';

const DisplayBlocks = () => {
  const [blocks, setBlocks] = useState([]);
  const navigate = useNavigate();
  const userType = localStorage.getItem('userType');
  const assignedBlock = localStorage.getItem('assignedBlock');

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/block');
        const allBlocks = res.data;

        if (userType === 'blockhead') {
          // BlockHead: filter to only their assigned block
          const filtered = allBlocks.filter(b =>
            b.blockName.toLowerCase() === assignedBlock?.toLowerCase()
          );
          setBlocks(filtered);
        } else {
          // Admin/SuperAdmin: show all blocks
          setBlocks(allBlocks);
        }
      } catch (err) {
        console.error('Failed to load blocks:', err);
      }
    };

    fetchBlocks();
  }, [userType, assignedBlock]);

  return (
    <div className="display-block-container">
      <h2>{userType === 'blockhead' ? 'My Block' : 'All Blocks'}</h2>
      <table className="block-table">
        <thead>
          <tr>
            <th>Block Name</th>
            <th>Block Types</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {blocks.map((block) => (
            <tr key={block._id}>
              <td>{block.blockName}</td>
              <td>{block.blockTypes.join(', ')}</td>
              <td>
                <button
                  onClick={() =>
                    navigate(`/viewblock/${encodeURIComponent(block.blockName)}`)
                  }
                >
                  👁️ View Block
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DisplayBlocks;
