import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './DisplayBlocks.css';
import { useNavigate } from 'react-router-dom';

const DisplayBlocks = () => {
  const [blocks, setBlocks] = useState([]);
  const userType = localStorage.getItem('userType');
  const assignedBlock = localStorage.getItem('assignedBlock');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/block');
        const allBlocks = res.data;

        if (userType === 'blockhead') {
          const filtered = allBlocks.filter(
            (b) => b.blockName.toLowerCase() === assignedBlock?.toLowerCase()
          );
          setBlocks(filtered);
        } else {
          setBlocks(allBlocks);
        }
      } catch (err) {
        console.error('Failed to load blocks:', err);
      }
    };

    fetchBlocks();
  }, [userType, assignedBlock]);

  const handleViewBlock = (blockName) => {
    navigate(`/view/${encodeURIComponent(blockName)}`); // navigate to details page
  };

  return (
    <div className="display-block-container">
      <h2 className="page-title">
        {userType === 'blockhead' ? 'My Block' : 'All Blocks'}
      </h2>

      <div className="table-wrapper">
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
                    className="view-btn"
                    onClick={() => handleViewBlock(block.blockName)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DisplayBlocks;
