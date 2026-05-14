import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { StatusBadge, AIResultDisplay } from '../components/DataPage';

function RiskScoreGauge({ score }) {
  if (!score) return null;
  const pct = Math.min(100, Math.max(0, ((score - 300) / 550) * 100));
  const color = score >= 740 ? '#10b981' : score >= 670 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
      <div className="relative w-32 h-16 overflow-hidden mb-2">
        <div className="absolute inset-0 rounded-full border-8 border-gray-200" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 0)' }} />
        <div className="text-3xl font-bold text-center" style={{ color }}>{score}</div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
        <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-gray-500 mt-1">300 &mdash; 850</span>
    </div>
  );
}

function FraudScoreBar({ score, risk }) {
  if (score == null) return null;
  const color = risk === 'low' ? '#10b981' : risk === 'medium' ? '#f59e0b' : risk === 'high' ? '#f97316' : '#ef4444';
  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">Fraud Score</span>
        <span className="text-2xl font-bold" style={{ color }}>{score}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className="h-3 rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold mt-1 inline-block px-2 py-0.5 rounded" style={{ backgroundColor: color + '20', color }}>{(risk||'').toUpperCase()} RISK</span>
    </div>
  );
}

function DecisionBadge({ decision }) {
  if (!decision) return null;
  const cfg = { approve: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '✓' }, deny: { color: 'bg-red-100 text-red-800 border-red-300', icon: '✗' }, suspend: { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: '⏸' } };
  const d = decision.toLowerCase();
  const c = cfg[d] || { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: '?' };
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-lg font-bold ${c.color}`}>
      <span>{c.icon}</span> {decision.toUpperCase()}
    </div>
  );
}

function RulesEvaluator({ applicationId }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const evaluate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/rules/evaluate/${applicationId}`);
      setResult(data);
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
    setLoading(false);
  };

  const decisionColor = { approve: 'bg-emerald-100 text-emerald-800', review: 'bg-amber-100 text-amber-800', deny: 'bg-red-100 text-red-800' };

  return (
    <div className="card mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Underwriting Rules Engine</h3>
        <button onClick={evaluate} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Evaluating...' : 'Evaluate Rules'}
        </button>
      </div>

      {result && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-500">Auto Decision:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${decisionColor[result.auto_decision] || 'bg-gray-100 text-gray-700'}`}>
              {(result.auto_decision || '').toUpperCase()}
            </span>
            <span className="text-xs text-gray-400">{result.summary?.passed}/{result.summary?.total_rules} rules passed</span>
          </div>

          {result.failed_rules?.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-red-700 mb-2">Failed Rules ({result.failed_rules.length})</h4>
              <div className="space-y-2">
                {result.failed_rules.map((f, i) => (
                  <div key={i} className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                    <span className="font-medium text-red-800">{f.rule.name}</span>
                    <span className="text-red-600 ml-2 text-xs">{f.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.passed_rules?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-emerald-700 mb-2">Passed Rules ({result.passed_rules.length})</h4>
              <div className="flex flex-wrap gap-2">
                {result.passed_rules.map((r, i) => (
                  <span key={i} className="bg-emerald-50 border border-emerald-200 rounded-full px-3 py-0.5 text-xs text-emerald-700">{r.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeAI, setActiveAI] = useState('');
  const [advancingStage, setAdvancingStage] = useState(false);

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
      if (appTypes.includes(type)) body = { application_id: parseInt(id) };
      else if (borrowerTypes.includes(type)) body = { borrower_id: app.borrower_id, loan_amount: app.loan_amount, interest_rate: app.interest_rate, term_months: app.term_months };
      else if (propertyTypes.includes(type)) body = { property_id: app.property_id };
      else if (type === 'insurance-requirements') body = { property_id: app.property_id, application_id: parseInt(id) };
      else if (type === 'loan-eligibility') body = { borrower_id: app.borrower_id, property_id: app.property_id };
      else if (type === 'fee-estimate') body = { loan_amount: app.loan_amount, loan_type: 'conventional' };
      else body = { application_id: parseInt(id) };

      const { data } = await api.post(`/ai/${type}`, body);
      setAiResult({ type, data });
    } catch (err) {
      setAiResult({ type, error: 'Error: ' + (err.response?.data?.error || err.message) });
    }
    setAiLoading(false);
  };

  const advanceStage = async () => {
    setAdvancingStage(true);
    try {
      const { data } = await api.put(`/applications/${id}/advance-stage`);
      alert(`Advanced to: ${data.new_stage || 'next stage'}\nReadiness: ${data.ai_guidance?.readiness_score}%`);
      api.get(`/applications/${id}`).then(r => setApp(r.data));
    } catch (err) { alert('Error: ' + (err.response?.data?.error || err.message)); }
    setAdvancingStage(false);
  };

  if (!app) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '-';

  // Render structured AI results
  const renderAIContent = () => {
    if (!aiResult) return null;
    if (aiResult.error) return <div className="card bg-red-50 border-red-200 text-red-700">{aiResult.error}</div>;

    const { type, data } = aiResult;
    const analysis = data.analysis;

    if (type === 'credit-risk' && data.structured && typeof analysis === 'object') {
      return (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Credit Risk Analysis</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <RiskScoreGauge score={analysis.risk_score} />
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">Category</span><span className={`font-bold capitalize px-2 py-0.5 rounded ${analysis.risk_category === 'excellent' ? 'bg-emerald-100 text-emerald-700' : analysis.risk_category === 'good' ? 'bg-blue-100 text-blue-700' : analysis.risk_category === 'fair' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{analysis.risk_category}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Recommend Approval</span><span className={`font-bold ${analysis.approve_recommendation ? 'text-emerald-600' : 'text-red-600'}`}>{analysis.approve_recommendation ? 'Yes' : 'No'}</span></div>
            </div>
          </div>
          {analysis.risk_factors?.length > 0 && <div className="mb-3"><h4 className="text-sm font-semibold text-red-700 mb-1">Risk Factors</h4><ul className="text-sm space-y-1">{analysis.risk_factors.map((f, i) => <li key={i} className="text-red-600 before:content-['•'] before:mr-2">{f}</li>)}</ul></div>}
          {analysis.conditions_if_approved?.length > 0 && <div><h4 className="text-sm font-semibold text-blue-700 mb-1">Conditions if Approved</h4><ul className="text-sm space-y-1">{analysis.conditions_if_approved.map((c, i) => <li key={i} className="text-blue-600 before:content-['•'] before:mr-2">{c}</li>)}</ul></div>}
        </div>
      );
    }

    if (type === 'fraud-detection' && data.structured && typeof analysis === 'object') {
      return (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Fraud Detection Analysis</h3>
          <FraudScoreBar score={analysis.fraud_score} risk={analysis.fraud_risk} />
          {analysis.red_flags?.length > 0 && <div className="mt-4 mb-3"><h4 className="text-sm font-semibold text-red-700 mb-2">Red Flags</h4><ul className="space-y-1">{analysis.red_flags.map((f, i) => <li key={i} className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded before:content-['!'] before:mr-2">{f}</li>)}</ul></div>}
          {analysis.verification_required?.length > 0 && <div className="mt-3"><h4 className="text-sm font-semibold text-amber-700 mb-2">Verification Required</h4><ul className="space-y-1">{analysis.verification_required.map((v, i) => <li key={i} className="text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded before:content-['→'] before:mr-2">{v}</li>)}</ul></div>}
          {analysis.recommendation && <div className="mt-4 p-3 bg-gray-50 rounded-lg"><span className="text-sm font-medium text-gray-700">Recommendation: </span><span className="text-sm text-gray-600">{analysis.recommendation}</span></div>}
        </div>
      );
    }

    if (type === 'underwriting-decision' && data.structured && typeof analysis === 'object') {
      return (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Underwriting Decision</h3>
          <div className="flex items-center gap-4 mb-4">
            <DecisionBadge decision={analysis.decision} />
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="h-2.5 rounded-full bg-blue-600" style={{ width: `${analysis.confidence}%` }} />
              </div>
              <span className="text-xs text-gray-500 mt-1 block">Confidence: {analysis.confidence}%</span>
            </div>
          </div>
          {analysis.rationale && <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mb-3">{analysis.rationale}</p>}
          {analysis.conditions?.length > 0 && <div className="mb-3"><h4 className="text-sm font-semibold text-blue-700 mb-1">Conditions</h4><ul className="space-y-1">{analysis.conditions.map((c, i) => <li key={i} className="text-sm text-blue-600 before:content-['•'] before:mr-2">{c}</li>)}</ul></div>}
          {analysis.denial_reasons?.length > 0 && <div><h4 className="text-sm font-semibold text-red-700 mb-1">Denial Reasons</h4><ul className="space-y-1">{analysis.denial_reasons.map((r, i) => <li key={i} className="text-sm text-red-600 before:content-['•'] before:mr-2">{r}</li>)}</ul></div>}
        </div>
      );
    }

    // Fallback to text display
    const textResult = typeof analysis === 'string' ? analysis : JSON.stringify(analysis, null, 2);
    return <AIResultDisplay result={textResult} loading={false} />;
  };

  return (
    <div>
      <Link to="/applications" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">&larr; Back to Applications</Link>

      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">{app.application_number}</h1>
        <StatusBadge status={app.status} />
        <StatusBadge status={app.priority} />
        <button onClick={advanceStage} disabled={advancingStage} className="ml-auto px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
          {advancingStage ? 'Advancing...' : 'Advance Pipeline Stage'}
        </button>
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

      {/* Rules Evaluator */}
      <RulesEvaluator applicationId={id} />

      {/* AI Analysis Buttons */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">AI Analysis Tools</h3>
        <div className="mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Borrower Analysis</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {[['credit-risk','Credit Risk'],['income-verification','Income Verify'],['dti-analysis','DTI Analysis'],['borrower-profile','Borrower Profile'],['loan-eligibility','Loan Eligibility'],['product-advisor','Product Advisor']].map(([type, label]) => (
              <button key={type} onClick={() => runAI(type)} disabled={aiLoading} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeAI === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'} ${aiLoading ? 'opacity-50' : ''}`}>{label}</button>
            ))}
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Property &amp; Valuation</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {[['property-valuation','Valuation'],['market-analysis','Market Analysis'],['appraisal-review','Appraisal Review'],['comparable-sales','Comp Sales'],['insurance-requirements','Insurance']].map(([type, label]) => (
              <button key={type} onClick={() => runAI(type)} disabled={aiLoading} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeAI === type ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'} ${aiLoading ? 'opacity-50' : ''}`}>{label}</button>
            ))}
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Application Review</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {[['underwriting-decision','Underwriting Decision'],['fraud-detection','Fraud Detection'],['document-analysis','Document Analysis'],['compliance-review','Compliance'],['risk-score','Risk Score'],['condition-generator','Generate Conditions'],['rate-lock-advisory','Rate Lock'],['fee-estimate','Fee Estimate']].map(([type, label]) => (
              <button key={type} onClick={() => runAI(type)} disabled={aiLoading} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeAI === type ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700'} ${aiLoading ? 'opacity-50' : ''}`}>{label}</button>
            ))}
          </div>
        </div>
        {aiLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-gray-500 font-medium">AI is analyzing...</p>
          </div>
        )}
      </div>

      {!aiLoading && renderAIContent()}
    </div>
  );
}
