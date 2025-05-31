import React from 'react';

function WelcomePage() {
  return (
    <div style={{
      backgroundColor: 'white',
      height: '100vh',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Blue Bar */}
      <div style={{
        backgroundColor: '#00008B',
        color: 'white',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <img
          src="/logo.png"
          alt="Kerala Police Logo"
          style={{ height: '60px', marginRight: '20px' }}
        />
        <div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>RMS</div>
          <div style={{ fontSize: '12px' }}>Kerala Police Academy</div>
        </div>
      </div>

      {/* Main Section */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '42px',
          fontWeight: '800',
          color: '#000',
          animation: 'fadeIn 2s ease-in-out'
        }}>
          ROOM MANAGEMENT SYSTEM
        </h1>

        <button style={{
          marginTop: '30px',
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#00008B',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background-color 0.3s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#1a1aff'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#00008B'}
        >
          Login
        </button>
      </div>

      {/* Animation keyframes */}
      <style>
        {`
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(-20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}

export default WelcomePage;

