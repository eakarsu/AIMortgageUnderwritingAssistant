import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Borrowers from './pages/Borrowers';
import BorrowerDetail from './pages/BorrowerDetail';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Documents from './pages/Documents';
import LoanProducts from './pages/LoanProducts';
import CreditReports from './pages/CreditReports';
import IncomeRecords from './pages/IncomeRecords';
import Appraisals from './pages/Appraisals';
import FeeSchedules from './pages/FeeSchedules';
import Conditions from './pages/Conditions';
import Compliance from './pages/Compliance';
import RiskAssessments from './pages/RiskAssessments';
import AuditLog from './pages/AuditLog';
import Notifications from './pages/Notifications';
import Users from './pages/Users';
import UnderwritingRules from './pages/UnderwritingRules';
import Pipeline from './pages/Pipeline';
import AICenter from './pages/AICenter';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/borrowers" element={<Borrowers />} />
          <Route path="/borrowers/:id" element={<BorrowerDetail />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/loan-products" element={<LoanProducts />} />
          <Route path="/credit-reports" element={<CreditReports />} />
          <Route path="/income" element={<IncomeRecords />} />
          <Route path="/appraisals" element={<Appraisals />} />
          <Route path="/fees" element={<FeeSchedules />} />
          <Route path="/conditions" element={<Conditions />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/risk" element={<RiskAssessments />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/users" element={<Users />} />
          <Route path="/rules" element={<UnderwritingRules />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/ai" element={<AICenter />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
