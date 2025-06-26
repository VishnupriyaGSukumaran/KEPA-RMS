import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';

import TopBar from './components/TopBar';
import ProtectedRoute from './components/ProtectedRoute'; // import this


import WelcomePage from './WelcomePage';
import Login from './LoginPage';

import SuperAdminDashboard from './system_adm/SuperAdminDashboard';
import CreateUser from './system_adm/CreateUser';
import DesignBlock from './system_adm/DesignBlock';
import CreateCourse from './system_adm/CreateCourse';
import DisplayBlock from './system_adm/DisplayBlock';
import GenerateReport from './system_adm/GenerateReport';
import RemoveBlock from './system_adm/RemoveBlock';
import Modify from './system_adm/Modify';
import CreateRooms from './system_adm/CreateRooms';

import AdminDashboard from './Admin/AdminDashboard';
import BlockHeads from './Admin/BlockHeads';

import BlockHeadDashboard from './Block_Head/BlockHeadDashboard';
import AllocationRoom from './Block_Head/AllocateRoom';

// 👇 This small component helps us see which route is loading
const LocationLogger = () => {
  const location = useLocation();
  console.log("📍 Current route:", location.pathname);
  return null; // it doesn’t show anything on screen
};

const App = () => {
  return (
    <Router>
      <TopBar />
      <TopBar />

      {/* 👇 This logs the route to the browser console */}
      <LocationLogger />
      <Routes>
        {/* Public Routes */}
        {/* Public */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/create-user"
          element={
            <ProtectedRoute>
              <CreateUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/Add-block"
          element={
            <ProtectedRoute>
              <DesignBlock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/create-course"
          element={
            <ProtectedRoute>
              <CreateCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/display-block"
          element={
            <ProtectedRoute>
              <DisplayBlock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/generate-report"
          element={
            <ProtectedRoute>
              <GenerateReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/remove-block"
          element={
            <ProtectedRoute>
              <RemoveBlock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/modify-block"
          element={
            <ProtectedRoute>
              <Modify />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/create-rooms"
          element={
            <ProtectedRoute>
              <CreateRooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/blockheads"
          element={
            <ProtectedRoute>
              <BlockHeads />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blockhead/dashboard/:blockName"
          element={
            <ProtectedRoute>
              <BlockHeadDashboard />
            </ProtectedRoute>
          }
        />

        {/* SuperAdmin */}
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/create-user" element={<CreateUser />} />
        <Route path="/superadmin/Add-block" element={<DesignBlock />} />
        <Route path="/superadmin/create-course" element={<CreateCourse />} />
        <Route path="/superadmin/display-block" element={<DisplayBlock />} />
        <Route path="/superadmin/generate-report" element={<GenerateReport />} />
        <Route path="/superadmin/remove-block" element={<RemoveBlock />} />
        <Route path="/superadmin/modify-block" element={<Modify />} />
        <Route path="/superadmin/create-rooms" element={<CreateRooms />} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/blockheads" element={<BlockHeads />} />

        {/* Block Head (Correct route) */}
        <Route path="/blockhead/dashboard/:blockName" element={<BlockHeadDashboard />} />
        <Route path="/blockhead/allocate-room/:blockName" element={<AllocationRoom />} />

      </Routes>
    </Router>
  );
};

export default App;
