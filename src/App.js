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
import ADashboard from './ADashboard';
import BHAssign from './BHAssign';
import BlocksRooms from './BlocksRooms';
import BlockHeadDashboard from './BlockHeadDashboard';
import AllocateRoom from './AllocateRoom';
import AllocateForm from './AllocateForm';
import VacateRoom from './VacateRoom';
import PaymentReceipt from './PaymentReceipt';
import FinalVacate from './FinalVacate';

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
        <Route path="/admin/dashboard" element={<ADashboard />} />
        <Route path="/blocks-rooms" element={<BlocksRooms />} />
        <Route path="/block-heads" element={<BHAssign />} />
        <Route path="/BlockHeadDashboard" element={<BlockHeadDashboard />} />
        <Route path="/AllocateRoom" element={<AllocateRoom />} />
        <Route path="/allocate-form/:purpose" element={<AllocateForm />} />
        <Route path="/VacateRoom" element={<VacateRoom />} />
        <Route path="/payment-receipt" element={<PaymentReceipt />} />
        <Route path="/final-vacate" element={<FinalVacate />} />
      </Routes>
    </Router>
  );
};

export default App;
