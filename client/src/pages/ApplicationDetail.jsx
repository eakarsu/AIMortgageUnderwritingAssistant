import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { StatusBadge, AIResultDisplay } from '../components/DataPage';

export default function ApplicationDetail() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeAI, setActiveAI] = useState('');

  useEffect(() => {
    api.get(`/applications/${id}`).then(r => setApp(r.data));
  }, [id]);

  const runAI = async (type) => {
    setAiLoading(true); setActiveAI(type); setAiResult(null);
    try {
      const appTypes = ['fraud-detection','underwriting-decision','risk-score','compliance-review','document-analysis','condition-generator','rate-lock-advisory'];
      const borrowerTypes = ['credit-risk','income-verification','dti-analysis','borrower-profile','product-advisor'];
      const propertyTypes = ['property-valuation','market-analysis','appraisal-review','comparable-sales'];

      let body;
      if (appTypes.includes(type)) {
        body = { application_id: parseInt(id) };
      } else if (borrowerTypes.includes(type)) {
        body = { borrower_id: app.borrower_id, loan_amount: app.loan_amount, interest_rate: app.interest_rate, term_months: app.term_months };
      } else if (propertyTypes.includes(type)) {
        body = { property_id: app.property_id };
      } else if (type === 'insurance-requirements') {
        body = { property_id: app.property_id, application_id: parseInt(id) };
      } else if (type === 'loan-eligibility') {
        body = { borrower_id: app.borrower_id, property_id: app.property_id };
      } else if (type === 'fee-estimate') {
        body = { loan_amount: app.loan_amount, loan_type: 'conventional' };
      } else {
        body = { application_id: parseInt(id) };
      }
      const { data } = await api.post(`/ai/${type}`, body);
      setAiResult(data.analysis);
    } catch (err) {
      setAiResult('Error: ' + (err.response?.data?.error || err.message));
    }
    setAiLoading(false);
  };

  if (!app) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '-';

  return (
    <div>
      <Link to="/applications" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">&larr; Back to Applications</Link>

      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">{app.application_number}</h1>
        <StatusBadge status={app.status} />
        <StatusBadge status={app.priority} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="font-semibold text-gray-500 text-sm uppercase mb-3">Loan Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold">{fmt(app.loan_amount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Down Payment</span><span className="font-semibold">{fmt(app.down_payment)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Rate</span><span className="font-semibold">{app.interest_rate}%</span></div>
            <div className="flex justify-between"><span className="text-gray-500">LTV</span><span className="font-semibold">{app.ltv_ratio}%</span></div>
            <div className="flex justify-between"><span className="text-gray-500">DTI</span><span className="font-semibold">{app.dti_ratio}%</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Term</span><span className="font-semibold">{app.term_months} months</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Purpose</span><span className="font-semibold capitalize">{app.purpose}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Product</span><span className="font-semibold">{app.product_name}</span></div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-500 text-sm uppercase mb-3">Borrower</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-semibold">{app.borrower_name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Credit Score</span><span className="font-semibold">{app.credit_score}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Income</span><span className="font-semibold">{fmt(app.annual_income)}/yr</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Monthly Debt</span><span className="font-semibold">{fmt(app.monthly_debt)}/mo</span></div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-500 text-sm uppercase mb-3">Property</h3>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-semibold text-right">{app.property_address}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="font-semibold">{app.property_city}, {app.property_state}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Value</span><span className="font-semibold">{fmt(app.estimated_value)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Underwriter</span><span className="font-semibold">{app.underwriter_name || 'Unassigned'}</span></div>
          </div>
        </div>
      </div>

      {/* AI Analysis Buttons */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">🤖 AI Analysis Tools</h3>
        <div className="mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Borrower Analysis</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {[['credit-risk','📊 Credit Risk'],['income-verification','💵 Income Verify'],['dti-analysis','📉 DTI Analysis'],['borrower-profile','👤 Borrower Profile'],['loan-eligibility','✅ Loan Eligibility'],['product-advisor','💡 Product Advisor']].map(([type, label]) => (
              <button key={type} onClick={() => runAI(type)} disabled={aiLoading} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeAI === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'} ${aiLoading ? 'opacity-50' : ''}`}>{label}</button>
            ))}
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Property & Valuation</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {[['property-valuation','🏠 Valuation'],['market-analysis','📈 Market Analysis'],['appraisal-review','🔍 Appraisal Review'],['comparable-sales','🏘️ Comp Sales'],['insurance-requirements','🛡️ Insurance']].map(([type, label]) => (
              <button key={type} onClick={() => runAI(type)} disabled={aiLoading} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeAI === type ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'} ${aiLoading ? 'opacity-50' : ''}`}>{label}</button>
            ))}
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Application Review</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {[['underwriting-decision','🏛️ Underwriting Decision'],['fraud-detection','🕵️ Fraud Detection'],['document-analysis','📄 Document Analysis'],['compliance-review','⚖️ Compliance'],['risk-score','⚠️ Risk Score'],['condition-generator','📋 Generate Conditions'],['rate-lock-advisory','🔒 Rate Lock'],['fee-estimate','💲 Fee Estimate']].map(([type, label]) => (
              <button key={type} onClick={() => runAI(type)} disabled={aiLoading} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeAI === type ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'} ${aiLoading ? 'opacity-50' : ''}`}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <AIResultDisplay result={aiResult} loading={aiLoading} />
    </div>
  );
}
