import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './WelcomePage';
import Login from './LoginPage';
import SuperAdminDashboard from './system_adm/SuperAdminDashboard';
import CreateUser  from './system_adm/CreateUser';
import DesignBlock from './system_adm/DesignBlock';
import CreateCourse from './system_adm/CreateCourse';
import DisplayBlock from './system_adm/DisplayBlock';
import GenerateReport from './system_adm/GenerateReport';
import BlockHeadDashboard from './BlockHeadDashboard';
import RemoveBlock from './system_adm/RemoveBlock';
import Modify from './system_adm/Modify';
import CreateRooms from './system_adm/CreateRooms';
import AdminDashboard from './Admin/AdminDashboard';
import BlockHeads from './Admin/BlockHeads';
 import ViewBlock from './ViewBlock';



// or the correct relative path where your component is

const App = () => {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/create-user" element={<CreateUser />} />
        <Route path="/superadmin/Add-block" element={<DesignBlock />} />
        <Route path="/superadmin/create-course" element={<CreateCourse />} />
        <Route path="/superadmin/display-block" element={<DisplayBlock />} />
        <Route path="/superadmin/generate-report" element={<GenerateReport />} />
        <Route path="/blockhead/dashboard/:blockName" element={<BlockHeadDashboard />} />
        <Route path="/superadmin/remove-block" element={<RemoveBlock />} />
        <Route path="/superadmin/modify-block" element={<Modify />} />
        <Route path="/superadmin/create-rooms" element={<CreateRooms />} /> 
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/blockheads" element={<BlockHeads />} />
        <Route path="/blockhead/dashboard/:blockName" element={<BlockHeadDashboard />} />
        <Route path="/ViewBlock" element={<ViewBlock />} />

      
        
        


      </Routes>
    </Router>
  );
};

export default App;
