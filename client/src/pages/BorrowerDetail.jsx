import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { StatusBadge, AIResultDisplay } from '../components/DataPage';

export default function BorrowerDetail() {
  const { id } = useParams();
  const [borrower, setBorrower] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeAI, setActiveAI] = useState('');

  useEffect(() => { api.get(`/borrowers/${id}`).then(r => setBorrower(r.data)); }, [id]);

  const runAI = async (type) => {
    setAiLoading(true); setActiveAI(type); setAiResult(null);
    try {
      const { data } = await api.post(`/ai/${type}`, { borrower_id: parseInt(id) });
      setAiResult(data.analysis);
    } catch (err) { setAiResult('Error: ' + (err.response?.data?.error || err.message)); }
    setAiLoading(false);
  };

  if (!borrower) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  const b = borrower;

  return (
    <div>
      <Link to="/borrowers" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">&larr; Back</Link>
      <h1 className="text-2xl font-bold mb-6">{b.first_name} {b.last_name}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold text-gray-500 text-sm uppercase mb-3">Personal Info</h3>
          <div className="space-y-2">
            {[['Email', b.email],['Phone', b.phone],['Address', `${b.address}, ${b.city}, ${b.state} ${b.zip}`],['DOB', b.date_of_birth]].map(([l,v]) => (
              <div key={l} className="flex justify-between"><span className="text-gray-500">{l}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-500 text-sm uppercase mb-3">Financial Profile</h3>
          <div className="space-y-2">
            {[['Credit Score', b.credit_score],['Annual Income', `$${Number(b.annual_income).toLocaleString()}`],['Monthly Debt', `$${Number(b.monthly_debt).toLocaleString()}`],['Employment', b.employment_status],['Employer', b.employer_name],['Title', b.job_title],['Years', b.years_employed]].map(([l,v]) => (
              <div key={l} className="flex justify-between"><span className="text-gray-500">{l}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
        </div>
      </div>
      <div className="card mb-6">
        <h3 className="font-semibold mb-4">🤖 AI Analysis</h3>
        <div className="flex flex-wrap gap-2">
          {[['credit-risk','📊 Credit Risk'],['income-verification','💵 Income Verify'],['dti-analysis','📉 DTI Analysis']].map(([t,l]) => (
            <button key={t} onClick={() => runAI(t)} disabled={aiLoading} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeAI===t?'bg-blue-600 text-white':'bg-gray-100 hover:bg-blue-50'}`}>{l}</button>
          ))}
        </div>
      </div>
      <AIResultDisplay result={aiResult} loading={aiLoading} />
    </div>
  );
}
