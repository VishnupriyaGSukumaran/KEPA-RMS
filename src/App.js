import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './WelcomePage';
import Login from './LoginPage';
import SuperAdminDashboard from './system_adm/SuperAdminDashboard';
import CreateUser from './system_adm/CreateUser';
import DesignBlock from './system_adm/DesignBlock';
import CreateCourse from './system_adm/CreateCourse';
import DisplayBlock from './system_adm/DisplayBlock';
import GenerateReport from './system_adm/GenerateReport';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/create-user" element={<CreateUser />} />
        <Route path="/superadmin/design-block" element={<DesignBlock />} />
        <Route path="/superadmin/create-course" element={<CreateCourse />} />
        <Route path="/superadmin/display-block" element={<DisplayBlock />} />
        <Route path="/superadmin/generate-report" element={<GenerateReport />} />
      </Routes>
    </Router>
  );
};

export default App;
