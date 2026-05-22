import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/applications', label: 'Applications', icon: '📋' },
  { path: '/borrowers', label: 'Borrowers', icon: '👤' },
  { path: '/properties', label: 'Properties', icon: '🏠' },
  { path: '/documents', label: 'Documents', icon: '📄' },
  { path: '/loan-products', label: 'Loan Products', icon: '💰' },
  { path: '/credit-reports', label: 'Credit Reports', icon: '📈' },
  { path: '/income', label: 'Income Records', icon: '💵' },
  { path: '/appraisals', label: 'Appraisals', icon: '🔍' },
  { path: '/fees', label: 'Fee Schedules', icon: '💲' },
  { path: '/conditions', label: 'Conditions', icon: '✅' },
  { path: '/compliance', label: 'Compliance', icon: '⚖️' },
  { path: '/risk', label: 'Risk Assessments', icon: '⚠️' },
  { path: '/pipeline', label: 'Pipeline', icon: '🔄' },
  { path: '/rules', label: 'Underwriting Rules', icon: '📏' },
  { path: '/audit', label: 'Audit Log', icon: '📝' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
  { path: '/users', label: 'Users', icon: '👥' },
];

const gapMenuItems = [
  { path: '/gap/appraisal', label: 'Appraisal', icon: '🏡' },
  { path: '/gap/asset-verification', label: 'Asset Verification', icon: '🏦' },
  { path: '/gap/borrower', label: 'Borrower Portal', icon: '🙋' },
  { path: '/gap/closing-readiness', label: 'Closing Readiness', icon: '🔒' },
  { path: '/gap/employment-verification', label: 'Employment Verify', icon: '💼' },
  { path: '/gap/e-signature', label: 'E-Signature', icon: '✍️' },
  { path: '/gap/pricing', label: 'Pricing Engine', icon: '💲' },
  { path: '/gap/third-party', label: 'Third-Party Hub', icon: '🔗' },
  { path: '/gap/title', label: 'Title Integration', icon: '📜' },
  { path: '/gap/title-risk-assessment', label: 'Title Risk', icon: '⚡' },
  { path: '/gap/webhooks', label: 'Webhooks (LOS)', icon: '🔔' },
  { path: '/gap/agentic', label: 'Agentic UW', icon: '🤖' },
  { path: '/gap/autonomous', label: 'Autonomous Pipeline', icon: '⚙️' },
  { path: '/gap/realtime', label: 'Realtime Fraud', icon: '🚨' },
  { path: '/gap/vision', label: 'Vision Doc Intel', icon: '👁️' },
];

export default function Layout({ children, user, onLogout }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [gapExpanded, setGapExpanded] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-slate-900 text-white transition-all duration-300 flex flex-col flex-shrink-0`}>
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-blue-400">MortgageAI</h1>
                <p className="text-xs text-slate-400">Underwriting Assistant</p>
              </div>
            )}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white p-1">
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span className="ml-3">{item.label}</span>}
            </Link>
          ))}
          {/* AI Center Link */}
          <Link
            to="/ai"
            className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
              location.pathname === '/ai'
                ? 'bg-purple-600 text-white'
                : 'text-purple-300 hover:bg-purple-900 hover:text-white'
            }`}
          >
            <span className="text-lg">🤖</span>
            {sidebarOpen && <span className="ml-3 font-semibold">AI Center</span>}
          </Link>

          {/* Gap AI Features section */}
          <button
            onClick={() => setGapExpanded(!gapExpanded)}
            className="flex items-center w-full px-4 py-2.5 text-sm text-emerald-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span className="text-lg">🧩</span>
            {sidebarOpen && (
              <>
                <span className="ml-3 font-semibold flex-1 text-left">Gap AI Features</span>
                <span className="text-xs">{gapExpanded ? '▲' : '▼'}</span>
              </>
            )}
          </button>
          {gapExpanded && gapMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-2 text-xs transition-colors ${
                location.pathname === item.path
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {sidebarOpen && <span className="ml-3">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          {sidebarOpen && (
            <div className="mb-2">
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
          )}
          <button onClick={onLogout} className="w-full text-left text-sm text-red-400 hover:text-red-300">
            {sidebarOpen ? 'Sign Out' : '🚪'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
