import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './BlockHeadDashboard.css';
import {
  FaBed, FaUsers, FaDoorOpen,
  FaSignOutAlt, FaTachometerAlt, FaDoorClosed, FaList
} from 'react-icons/fa';

const BlockHeadDashboard = () => {
  const { blockName } = useParams();
  const pen = localStorage.getItem('pen');
  const [blockData, setBlockData] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!pen) {
      console.warn('No PEN found in localStorage');
      return;
    }

    fetch(`http://localhost:5000/api/blockheadnew/${pen}`)
      .then(res => res.json())
      .then(user => {
        console.log('Fetched user:', user);
        setUserData(user);

        if (user.userType === 'blockhead' && blockName) {
          fetch(`http://localhost:5000/api/block/name/${encodeURIComponent(blockName)}`)
            .then(res => res.json())
            .then(data => {
              console.log('Fetched block:', data);
              setBlockData(data);
            })
            .catch(err => console.error('Error fetching block data:', err));
        } else {
          console.warn('User is not a blockhead or has no assigned block');
        }
      })
      .catch(err => console.error('Error fetching user data:', err));
  }, [pen, blockName]);

  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const totalRooms = blockData?.createdRooms?.length || 0;
  const totalBeds = blockData?.createdRooms?.reduce(
    (sum, room) => sum + (room.bedCount || 0), 0
  );
  const vacantBeds = totalBeds;

  const dormitoryCount = blockData?.createdRooms?.filter(
    room => room.roomType === 'Dormitory'
  ).length || 0;

  return (
    <>
      <div className="dashboard-container">
        <aside className="sidebar">
          <div className="profile">
            <h3>{userData ? `Insp. ${userData.firstName} ${userData.lastName}` : 'Loading...'}</h3>
            <p>Block Head - {blockName || '...'}</p>
          </div>
          <nav className="menu">
            <Link to={`/blockhead/dashboard/${blockName}`}>
              <FaTachometerAlt /> Dashboard
            </Link>

            <button onClick={() => navigate(`/blockhead/allocate-room/${blockName}`)}>
              <FaDoorOpen /> Allocate Room
            </button>

            <Link to={`/blockhead/vacate-room/${blockName}`}>
              <FaDoorClosed /> Vacate Room
            </Link>

            <Link to={`/blockhead/display-block/${blockName}`}>
              <FaList /> Display Block
            </Link>
          </nav>

          <button
            onClick={logout}
            style={{
              marginTop: '2rem',
              background: 'none',
              border: '1px solid white',
              padding: '0.5rem 1rem',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <FaSignOutAlt /> Logout
          </button>
        </aside>

        <main className="main-content">
          <h3 className="allocation-title">{blockName?.toUpperCase() || 'LOADING'} ROOM ALLOCATION</h3>

          <h4>Block Statistics</h4>
          <div className="stats">
            <div className="stat-card blue">
              <h5>Total Rooms</h5>
              <p>{totalRooms}</p>
              <h5>Dormitories</h5>
              <p>{dormitoryCount}</p>
              <FaDoorOpen className="icon" />
            </div>
            <div className="stat-card green">
              <h5>Total Beds</h5>
              <p>{totalBeds}</p>
              <FaBed className="icon" />
            </div>
            <div className="stat-card red">
              <h5>Vacant Beds</h5>
              <p>{vacantBeds}</p>
              <FaUsers className="icon" />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default BlockHeadDashboard;