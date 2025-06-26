import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './DisplayBlock.css';

const DisplayBlock = () => {
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    axios.get('/api/blocks')
      .then(res => {
        console.log('Fetched blocks:', res.data);
        setBlocks(res.data);
      })
      .catch(err => {
        console.error('Error fetching blocks:', err);
      });
  }, []);

  return (
    <div className="display-block-container">
      <h1 className="page-title">Display Block</h1>

      {blocks.length === 0 ? (
        <p className="no-blocks">No blocks found.</p>
      ) : (
        blocks.map((block) => (
          <div key={block._id} className="block-card">
            <h2 className="block-name">{block.blockName}</h2>

            {(block.blockTypeDetails || []).map((typeDetail, index) => (
              <div key={index} className="type-section">
                <h3 className="type-title">{typeDetail.type} ({typeDetail.count})</h3>

                <div className="room-grid">
                  {(typeDetail.rooms || []).map((room, i) => (
                    <div key={i} className="room-card">
                      <p><strong>Room No:</strong> {room.roomNumber}</p>
                      <p><strong>Status:</strong> {room.status || 'N/A'}</p>
                      <p><strong>Beds:</strong> {room.bedCount || '-'}</p>
                      <p><strong>Allocated:</strong> {room.allocatedBeds || 0}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default DisplayBlock;
