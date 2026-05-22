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
import CompensatingFactorMatrix from './pages/CompensatingFactorMatrix';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

// Gap feature pages
import GapAppraisal from './pages/GapAppraisal';
import GapAssetVerification from './pages/GapAssetVerification';
import GapBorrower from './pages/GapBorrower';
import GapClosingReadiness from './pages/GapClosingReadiness';
import GapEmploymentVerification from './pages/GapEmploymentVerification';
import GapESignature from './pages/GapESignature';
import GapPricing from './pages/GapPricing';
import GapThirdParty from './pages/GapThirdParty';
import GapTitle from './pages/GapTitle';
import GapTitleRiskAssessment from './pages/GapTitleRiskAssessment';
import GapWebhooks from './pages/GapWebhooks';
import GapAgentic from './pages/GapAgentic';
import GapAutonomous from './pages/GapAutonomous';
import GapRealTime from './pages/GapRealTime';
import GapVisionBased from './pages/GapVisionBased';

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
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

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
          <Route path="/compensating-factor-matrix" element={<CompensatingFactorMatrix />} />

          {/* Gap feature routes */}
          <Route path="/gap/appraisal" element={<GapAppraisal />} />
          <Route path="/gap/asset-verification" element={<GapAssetVerification />} />
          <Route path="/gap/borrower" element={<GapBorrower />} />
          <Route path="/gap/closing-readiness" element={<GapClosingReadiness />} />
          <Route path="/gap/employment-verification" element={<GapEmploymentVerification />} />
          <Route path="/gap/e-signature" element={<GapESignature />} />
          <Route path="/gap/pricing" element={<GapPricing />} />
          <Route path="/gap/third-party" element={<GapThirdParty />} />
          <Route path="/gap/title" element={<GapTitle />} />
          <Route path="/gap/title-risk-assessment" element={<GapTitleRiskAssessment />} />
          <Route path="/gap/webhooks" element={<GapWebhooks />} />
          <Route path="/gap/agentic" element={<GapAgentic />} />
          <Route path="/gap/autonomous" element={<GapAutonomous />} />
          <Route path="/gap/realtime" element={<GapRealTime />} />
          <Route path="/gap/vision" element={<GapVisionBased />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
