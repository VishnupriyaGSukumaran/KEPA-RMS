import React from 'react';
import logo from './public/logo.png'; // Update with your actual logo path
import bgImage from './assets/background.jpg'; // Background image path
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Navbar */}
      <div className="bg-blue-900 text-white p-4 flex items-center">
        <img src={logo} alt="Kerala Police Logo" className="h-10 w-10 mr-3" />
        <h1 className="text-xl font-bold">Kerala Police Academy</h1>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center text-white text-center px-4">
        <h2 className="text-5xl font-bold mb-4">Room Management System</h2>
        <p className="text-xl mb-8">
          Efficiently manage training facilities and accommodations at Kerala Police Academy
        </p>
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow-md transition"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;
