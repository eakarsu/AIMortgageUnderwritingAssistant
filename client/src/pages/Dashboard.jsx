import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const featureCards = [
  { path: '/applications', label: 'Loan Applications', icon: '📋', desc: 'Manage loan applications and track status', color: 'from-blue-500 to-blue-600' },
  { path: '/borrowers', label: 'Borrowers', icon: '👤', desc: 'Borrower profiles and information', color: 'from-indigo-500 to-indigo-600' },
  { path: '/properties', label: 'Properties', icon: '🏠', desc: 'Property details and valuations', color: 'from-emerald-500 to-emerald-600' },
  { path: '/documents', label: 'Documents', icon: '📄', desc: 'Document management and review', color: 'from-amber-500 to-amber-600' },
  { path: '/loan-products', label: 'Loan Products', icon: '💰', desc: 'Available loan programs and rates', color: 'from-violet-500 to-violet-600' },
  { path: '/credit-reports', label: 'Credit Reports', icon: '📈', desc: 'Credit bureau reports and scores', color: 'from-cyan-500 to-cyan-600' },
  { path: '/income', label: 'Income Records', icon: '💵', desc: 'Income verification and records', color: 'from-green-500 to-green-600' },
  { path: '/appraisals', label: 'Appraisals', icon: '🔍', desc: 'Property appraisal reports', color: 'from-orange-500 to-orange-600' },
  { path: '/fees', label: 'Fee Schedules', icon: '💲', desc: 'Closing costs and fee management', color: 'from-pink-500 to-pink-600' },
  { path: '/conditions', label: 'Conditions', icon: '✅', desc: 'Loan conditions and checklist', color: 'from-teal-500 to-teal-600' },
  { path: '/compliance', label: 'Compliance', icon: '⚖️', desc: 'Regulatory compliance checks', color: 'from-red-500 to-red-600' },
  { path: '/risk', label: 'Risk Assessments', icon: '⚠️', desc: 'Risk analysis and scoring', color: 'from-yellow-500 to-yellow-600' },
  { path: '/pipeline', label: 'Pipeline', icon: '🔄', desc: 'Application pipeline and workflow', color: 'from-sky-500 to-sky-600' },
  { path: '/rules', label: 'Underwriting Rules', icon: '📏', desc: 'Automated underwriting rules', color: 'from-fuchsia-500 to-fuchsia-600' },
  { path: '/ai', label: 'AI Center', icon: '🤖', desc: 'AI-powered analysis tools', color: 'from-purple-500 to-purple-600' },
  { path: '/audit', label: 'Audit Log', icon: '📝', desc: 'System activity audit trail', color: 'from-slate-500 to-slate-600' },
  { path: '/notifications', label: 'Notifications', icon: '🔔', desc: 'Alerts and notifications', color: 'from-rose-500 to-rose-600' },
  { path: '/users', label: 'User Management', icon: '👥', desc: 'System users and roles', color: 'from-lime-500 to-lime-600' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">AI Mortgage Underwriting Assistant Overview</p>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.total_applications}</p>
            <p className="text-xs text-gray-500 mt-1">Total Applications</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.status_breakdown?.approved || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Approved</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.status_breakdown?.in_review || 0}</p>
            <p className="text-xs text-gray-500 mt-1">In Review</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-indigo-600">{stats.total_borrowers}</p>
            <p className="text-xs text-gray-500 mt-1">Borrowers</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">${(stats.total_loan_volume / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-gray-500 mt-1">Loan Volume</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-red-600">{stats.high_risk_count}</p>
            <p className="text-xs text-gray-500 mt-1">High Risk</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.pending_conditions}</p>
            <p className="text-xs text-gray-500 mt-1">Pending Conditions</p>
          </div>
        </div>
      )}

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {featureCards.map((card) => (
          <Link
            key={card.path}
            to={card.path}
            className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`bg-gradient-to-r ${card.color} p-4`}>
              <span className="text-3xl">{card.icon}</span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{card.label}</h3>
              <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
