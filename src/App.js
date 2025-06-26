import React from 'react';
import TopBar from './components/TopBar';
import ProtectedRoute from './components/ProtectedRoute'; // import this

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import WelcomePage from './WelcomePage';
import Login from './LoginPage';
import SuperAdminDashboard from './system_adm/SuperAdminDashboard';
import CreateUser from './system_adm/CreateUser';
import DesignBlock from './system_adm/DesignBlock';
import CreateCourse from './system_adm/CreateCourse';
import DisplayBlock from './system_adm/DisplayBlock';
import GenerateReport from './system_adm/GenerateReport';
import BlockHeadDashboard from './Block_Head/BlockHeadDashboard';
import RemoveBlock from './system_adm/RemoveBlock';
import Modify from './system_adm/Modify';
import CreateRooms from './system_adm/CreateRooms';
import AllocateRoom from './Block_Head/AllocateRoom';
import AdminDashboard from './Admin/AdminDashboard';
import BlockHeads from './Admin/BlockHeads';
import ViewBlock from './Block_Head/ViewBlock';
import VacateRoom from './Block_Head/VacateRoom';
import AllocateForm from './Block_Head/AllocateForm';
const App = () => {
  return (
    <Router>
      <TopBar />
      <Routes>
        {/* Public Routes */}
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
        <Route
          path="/blockhead/AllocateRoom"
          element={
            <ProtectedRoute>
              <AllocateRoom />
            </ProtectedRoute>
          }
        />
        <Route
  path="/blockhead/ViewBlock/:blockName"
  element={
    <ProtectedRoute>
      <ViewBlock />
    </ProtectedRoute>
  }
/>
 <Route
          path="/blockhead/VacateRoom"
          element={
            <ProtectedRoute>
              <VacateRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blockhead/AllocateForm/:purpose"
          element={
            <ProtectedRoute>
              <AllocateForm />
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
};

export default App;
