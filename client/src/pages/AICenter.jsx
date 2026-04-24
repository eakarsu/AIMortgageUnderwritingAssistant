import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { AIResultDisplay, FormField } from '../components/DataPage';

const aiTools = [
  { id: 'credit-risk', name: 'Credit Risk Assessment', icon: '📊', desc: 'Analyze borrower credit risk profile using credit reports and history', category: 'Borrower Analysis', color: 'from-blue-500 to-blue-600' },
  { id: 'income-verification', name: 'Income Verification', icon: '💵', desc: 'Verify and analyze income documentation for qualification', category: 'Borrower Analysis', color: 'from-green-500 to-green-600' },
  { id: 'dti-analysis', name: 'DTI Analysis', icon: '📉', desc: 'Calculate debt-to-income ratios and affordability', category: 'Borrower Analysis', color: 'from-purple-500 to-purple-600' },
  { id: 'borrower-profile', name: 'Borrower Profile Analysis', icon: '👤', desc: 'Comprehensive borrower strength assessment across all dimensions', category: 'Borrower Analysis', color: 'from-indigo-500 to-indigo-600' },
  { id: 'loan-eligibility', name: 'Loan Eligibility', icon: '✅', desc: 'Match borrower to eligible loan programs', category: 'Borrower Analysis', color: 'from-teal-500 to-teal-600' },
  { id: 'product-advisor', name: 'Loan Product Advisor', icon: '💡', desc: 'AI-powered personalized loan product recommendations', category: 'Borrower Analysis', color: 'from-yellow-500 to-yellow-600' },
  { id: 'property-valuation', name: 'Property Valuation', icon: '🏠', desc: 'AI property value assessment with market data', category: 'Property & Valuation', color: 'from-emerald-500 to-emerald-600' },
  { id: 'market-analysis', name: 'Market Analysis', icon: '📈', desc: 'Local real estate market conditions and trends', category: 'Property & Valuation', color: 'from-cyan-500 to-cyan-600' },
  { id: 'appraisal-review', name: 'Appraisal Review', icon: '🔍', desc: 'AI review of appraisal quality and accuracy', category: 'Property & Valuation', color: 'from-sky-500 to-sky-600' },
  { id: 'comparable-sales', name: 'Comparable Sales Analysis', icon: '🏘️', desc: 'Automated CMA with adjustments and value conclusion', category: 'Property & Valuation', color: 'from-lime-500 to-lime-600' },
  { id: 'insurance-requirements', name: 'Insurance Requirements', icon: '🛡️', desc: 'Determine all insurance needs for the mortgage', category: 'Property & Valuation', color: 'from-amber-500 to-amber-600' },
  { id: 'underwriting-decision', name: 'Underwriting Decision', icon: '🏛️', desc: 'AI automated underwriting recommendation', category: 'Application Review', color: 'from-violet-500 to-violet-600' },
  { id: 'fraud-detection', name: 'Fraud Detection', icon: '🕵️', desc: 'Screen for fraud indicators and red flags', category: 'Application Review', color: 'from-red-500 to-red-600' },
  { id: 'document-analysis', name: 'Document Analysis', icon: '📄', desc: 'Analyze loan file completeness and gaps', category: 'Application Review', color: 'from-amber-500 to-amber-600' },
  { id: 'compliance-review', name: 'Compliance Review', icon: '⚖️', desc: 'Regulatory compliance analysis (TRID, HMDA, QM)', category: 'Application Review', color: 'from-rose-500 to-rose-600' },
  { id: 'risk-score', name: 'Risk Scoring', icon: '⚠️', desc: 'Comprehensive 5-C risk scoring across all dimensions', category: 'Application Review', color: 'from-orange-500 to-orange-600' },
  { id: 'condition-generator', name: 'Condition Generator', icon: '📋', desc: 'AI-generated underwriting conditions and stipulations', category: 'Application Review', color: 'from-pink-500 to-pink-600' },
  { id: 'rate-lock-advisory', name: 'Rate Lock Advisory', icon: '🔒', desc: 'Strategic rate lock/float recommendations', category: 'Application Review', color: 'from-blue-500 to-indigo-600' },
  { id: 'fee-estimate', name: 'Fee Estimator', icon: '💲', desc: 'Estimate closing costs and TRID-compliant fee breakdown', category: 'Application Review', color: 'from-fuchsia-500 to-fuchsia-600' },
  { id: 'pipeline-optimizer', name: 'Pipeline Optimizer', icon: '🔄', desc: 'Identify bottlenecks and optimize loan processing', category: 'Operations & Intelligence', color: 'from-teal-500 to-cyan-600' },
  { id: 'workload-analysis', name: 'Workload Analysis', icon: '👥', desc: 'Team workload balance and resource allocation', category: 'Operations & Intelligence', color: 'from-blue-500 to-blue-700' },
  { id: 'rule-suggestion', name: 'Rule Suggestions', icon: '📏', desc: 'AI-recommended underwriting rule improvements', category: 'Operations & Intelligence', color: 'from-indigo-500 to-violet-600' },
  { id: 'audit-anomaly', name: 'Audit Anomaly Detection', icon: '🔐', desc: 'Detect suspicious patterns in system audit logs', category: 'Operations & Intelligence', color: 'from-red-600 to-red-800' },
  { id: 'notification-intelligence', name: 'Smart Notifications', icon: '🔔', desc: 'AI-prioritized alerts and team notifications', category: 'Operations & Intelligence', color: 'from-amber-500 to-orange-600' },
  { id: 'portfolio-risk', name: 'Portfolio Risk Analysis', icon: '📊', desc: 'Aggregate portfolio risk, concentration, and stress testing', category: 'Operations & Intelligence', color: 'from-slate-500 to-slate-700' },
];

const categories = ['Borrower Analysis', 'Property & Valuation', 'Application Review', 'Operations & Intelligence'];

// Sample presets - each tool gets multiple quick-load combos
const samplePresets = {
  'credit-risk': [
    { label: 'John Smith (780)', data: { borrower_id: 1 } },
    { label: 'Sarah Davis (710)', data: { borrower_id: 6 } },
    { label: 'Megan King (700)', data: { borrower_id: 20 } },
    { label: 'David Brown (800)', data: { borrower_id: 5 } },
  ],
  'income-verification': [
    { label: 'John Smith - Google Engineer', data: { borrower_id: 1 } },
    { label: 'Robert Johnson - Self-Employed', data: { borrower_id: 3 } },
    { label: 'Michael Martinez - Physician', data: { borrower_id: 7 } },
    { label: 'Kevin Hall - Retired Military', data: { borrower_id: 17 } },
  ],
  'dti-analysis': [
    { label: 'John Smith - $680K Loan', data: { borrower_id: 1, loan_amount: 680000 } },
    { label: 'Sarah Davis - High DTI', data: { borrower_id: 6, loan_amount: 340000 } },
    { label: 'David Brown - Jumbo $920K', data: { borrower_id: 5, loan_amount: 920000 } },
    { label: 'Megan King - First Time $320K', data: { borrower_id: 20, loan_amount: 320000 } },
  ],
  'borrower-profile': [
    { label: 'John Smith - Strong Profile', data: { borrower_id: 1 } },
    { label: 'Sarah Davis - Borderline', data: { borrower_id: 6 } },
    { label: 'Robert Johnson - Self-Employed', data: { borrower_id: 3 } },
    { label: 'Stephanie Allen - High Income', data: { borrower_id: 18 } },
  ],
  'loan-eligibility': [
    { label: 'John Smith + LA Home', data: { borrower_id: 1, property_id: 1 } },
    { label: 'Maria Garcia + Denver Home', data: { borrower_id: 2, property_id: 3 } },
    { label: 'David Brown + NYC Condo', data: { borrower_id: 5, property_id: 5 } },
    { label: 'Kevin Hall + VA Beach Condo', data: { borrower_id: 17, property_id: 19 } },
  ],
  'product-advisor': [
    { label: 'John Smith - High Credit', data: { borrower_id: 1 } },
    { label: 'Maria Garcia - FHA Candidate', data: { borrower_id: 2 } },
    { label: 'Emily Jackson - VA Eligible', data: { borrower_id: 10 } },
    { label: 'Megan King - First-Time Buyer', data: { borrower_id: 20 } },
  ],
  'property-valuation': [
    { label: '123 Sunset Blvd, LA', data: { property_id: 1 } },
    { label: '654 Park Ave, NYC', data: { property_id: 5 } },
    { label: '348 Vineyard Ln, Napa', data: { property_id: 17 } },
    { label: '147 Bayfront Dr, Miami (Flood)', data: { property_id: 7 } },
  ],
  'market-analysis': [
    { label: 'Los Angeles, CA', data: { property_id: 1 } },
    { label: 'New York, NY', data: { property_id: 5 } },
    { label: 'Austin, TX', data: { property_id: 15 } },
    { label: 'Seattle, WA', data: { property_id: 10 } },
  ],
  'appraisal-review': [
    { label: 'Sunset Blvd - Completed', data: { property_id: 1 } },
    { label: 'Mountain View - Excellent', data: { property_id: 3 } },
    { label: 'Bayfront Miami - Flood Zone', data: { property_id: 7 } },
    { label: 'Palm Dr - Pending', data: { property_id: 16 } },
  ],
  'comparable-sales': [
    { label: 'LA Single Family', data: { property_id: 1 } },
    { label: 'Chicago Condo', data: { property_id: 2 } },
    { label: 'San Jose Home', data: { property_id: 9 } },
    { label: 'Nashville Townhouse', data: { property_id: 12 } },
  ],
  'insurance-requirements': [
    { label: 'Miami Condo (Flood Zone)', data: { property_id: 7, application_id: 7 } },
    { label: 'LA Home - Standard', data: { property_id: 1, application_id: 1 } },
    { label: 'VA Beach Condo (Coastal)', data: { property_id: 19, application_id: 17 } },
    { label: 'Napa - High Value', data: { property_id: 17, application_id: 18 } },
  ],
  'underwriting-decision': [
    { label: 'APP-2024-001 - In Review', data: { application_id: 1 } },
    { label: 'APP-2024-006 - High DTI', data: { application_id: 6 } },
    { label: 'APP-2024-005 - Jumbo', data: { application_id: 5 } },
    { label: 'APP-2024-020 - USDA', data: { application_id: 20 } },
  ],
  'fraud-detection': [
    { label: 'APP-2024-001 - Standard', data: { application_id: 1 } },
    { label: 'APP-2024-006 - High Risk', data: { application_id: 6 } },
    { label: 'APP-2024-016 - High Value', data: { application_id: 16 } },
    { label: 'APP-2024-018 - Jumbo $1.2M', data: { application_id: 18 } },
  ],
  'document-analysis': [
    { label: 'APP-2024-001 - Full Docs', data: { application_id: 1 } },
    { label: 'APP-2024-002 - Missing Tax', data: { application_id: 2 } },
    { label: 'APP-2024-005 - Jumbo Docs', data: { application_id: 5 } },
    { label: 'APP-2024-012 - Pending', data: { application_id: 12 } },
  ],
  'compliance-review': [
    { label: 'APP-2024-001 - Conventional', data: { application_id: 1 } },
    { label: 'APP-2024-006 - QM Fail', data: { application_id: 6 } },
    { label: 'APP-2024-010 - VA Loan', data: { application_id: 10 } },
    { label: 'APP-2024-020 - USDA', data: { application_id: 20 } },
  ],
  'risk-score': [
    { label: 'APP-2024-001 - Low Risk', data: { application_id: 1 } },
    { label: 'APP-2024-006 - High Risk', data: { application_id: 6 } },
    { label: 'APP-2024-011 - Denied', data: { application_id: 11 } },
    { label: 'APP-2024-007 - Physician', data: { application_id: 7 } },
  ],
  'condition-generator': [
    { label: 'APP-2024-001 - In Review', data: { application_id: 1 } },
    { label: 'APP-2024-002 - Submitted', data: { application_id: 2 } },
    { label: 'APP-2024-006 - Conditional', data: { application_id: 6 } },
    { label: 'APP-2024-015 - High Priority', data: { application_id: 15 } },
  ],
  'rate-lock-advisory': [
    { label: 'APP-2024-001 - 6.875%', data: { application_id: 1 } },
    { label: 'APP-2024-005 - Jumbo 7.25%', data: { application_id: 5 } },
    { label: 'APP-2024-010 - VA 6.25%', data: { application_id: 10 } },
    { label: 'APP-2024-020 - USDA 5.875%', data: { application_id: 20 } },
  ],
  'fee-estimate': [
    { label: '$500K Conventional', data: { loan_amount: 500000, loan_type: 'conventional' } },
    { label: '$300K FHA', data: { loan_amount: 300000, loan_type: 'fha' } },
    { label: '$400K VA', data: { loan_amount: 400000, loan_type: 'va' } },
    { label: '$1M Jumbo', data: { loan_amount: 1000000, loan_type: 'jumbo' } },
  ],
  'pipeline-optimizer': [
    { label: 'Full Pipeline Analysis', data: {} },
  ],
  'workload-analysis': [
    { label: 'Full Team Analysis', data: {} },
  ],
  'rule-suggestion': [
    { label: 'All Rules Review', data: {} },
  ],
  'audit-anomaly': [
    { label: 'Recent Activity Scan', data: {} },
  ],
  'notification-intelligence': [
    { label: 'Generate Smart Alerts', data: {} },
  ],
  'portfolio-risk': [
    { label: 'Full Portfolio Analysis', data: {} },
  ],
};

export default function AICenter() {
  const [searchParams] = useSearchParams();
  const [selectedTool, setSelectedTool] = useState(null);
  const [form, setForm] = useState({});
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [borrowers, setBorrowers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    api.get('/borrowers').then(r => setBorrowers(r.data));
    api.get('/properties').then(r => setProperties(r.data));
    api.get('/applications').then(r => setApplications(r.data));
  }, []);

  useEffect(() => {
    const toolId = searchParams.get('tool');
    if (toolId) {
      const tool = aiTools.find(t => t.id === toolId);
      if (tool) { setSelectedTool(tool); setForm({}); setAiResult(null); }
    }
  }, [searchParams]);

  const runAnalysis = async () => {
    if (!selectedTool) return;
    setLoading(true); setAiResult(null);
    try {
      const { data } = await api.post(`/ai/${selectedTool.id}`, form);
      setAiResult(data.analysis);
    } catch (err) {
      setAiResult('Error: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  const loadSample = (preset) => {
    setForm(preset.data);
    setAiResult(null);
  };

  const filteredTools = activeCategory ? aiTools.filter(t => t.category === activeCategory) : aiTools;
  const presets = selectedTool ? (samplePresets[selectedTool.id] || []) : [];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Analysis Center</h1>
            <p className="text-gray-500 text-sm">25 AI-powered mortgage underwriting tools</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setActiveCategory(null)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!activeCategory ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-purple-50 border'}`}>
          All ({aiTools.length})
        </button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === cat ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-purple-50 border'}`}>
            {cat} ({aiTools.filter(t => t.category === cat).length})
          </button>
        ))}
      </div>

      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {filteredTools.map(tool => (
          <div key={tool.id} onClick={() => { setSelectedTool(tool); setForm({}); setAiResult(null); }}
            className={`cursor-pointer rounded-xl overflow-hidden shadow-sm border transition-all hover:shadow-lg hover:-translate-y-1 ${selectedTool?.id === tool.id ? 'ring-2 ring-purple-500 shadow-lg' : ''}`}>
            <div className={`bg-gradient-to-r ${tool.color} p-4 flex items-center gap-3`}>
              <span className="text-3xl">{tool.icon}</span>
              <div>
                <h3 className="font-semibold text-white text-sm">{tool.name}</h3>
                <p className="text-white/70 text-[10px]">{tool.category}</p>
              </div>
            </div>
            <div className="p-3 bg-white">
              <p className="text-xs text-gray-500">{tool.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Tool Input Panel */}
      {selectedTool && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${selectedTool.color} flex items-center justify-center`}>
              <span className="text-xl">{selectedTool.icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{selectedTool.name}</h3>
              <p className="text-sm text-gray-500">{selectedTool.desc}</p>
            </div>
          </div>

          {/* Sample Data Buttons */}
          {presets.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Load Sample Data</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => loadSample(preset)}
                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-300 transition-all"
                  >
                    ⚡ {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Dropdowns - always show all available data selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            <FormField label="Borrower">
              <select className="input-field" value={form.borrower_id||''} onChange={e => setForm({...form, borrower_id: e.target.value ? parseInt(e.target.value) : undefined})}>
                <option value="">Select Borrower...</option>
                {borrowers.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.first_name} {b.last_name} — Score: {b.credit_score}, ${Number(b.annual_income).toLocaleString()}/yr
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Property">
              <select className="input-field" value={form.property_id||''} onChange={e => setForm({...form, property_id: e.target.value ? parseInt(e.target.value) : undefined})}>
                <option value="">Select Property...</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.address}, {p.city} {p.state} — ${Number(p.estimated_value).toLocaleString()}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Application">
              <select className="input-field" value={form.application_id||''} onChange={e => setForm({...form, application_id: e.target.value ? parseInt(e.target.value) : undefined})}>
                <option value="">Select Application...</option>
                {applications.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.application_number} — {a.borrower_name} — ${Number(a.loan_amount).toLocaleString()} ({a.status})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Loan Amount ($)">
              <input className="input-field" type="number" placeholder="e.g. 500000" value={form.loan_amount||''} onChange={e => setForm({...form, loan_amount: e.target.value})} />
            </FormField>
            <FormField label="Loan Type">
              <select className="input-field" value={form.loan_type||''} onChange={e => setForm({...form, loan_type: e.target.value})}>
                <option value="">Select Type...</option>
                <option value="conventional">Conventional</option>
                <option value="fha">FHA</option>
                <option value="va">VA</option>
                <option value="usda">USDA</option>
                <option value="jumbo">Jumbo</option>
                <option value="arm">ARM</option>
              </select>
            </FormField>
            <FormField label="Property State">
              <select className="input-field" value={form.property_state||''} onChange={e => setForm({...form, property_state: e.target.value})}>
                <option value="">Select State...</option>
                {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
          </div>

          {/* Currently Selected Summary */}
          <div className="bg-gray-50 rounded-lg p-3 mb-5 flex flex-wrap gap-3 text-xs">
            <span className="text-gray-400 font-medium">Selected:</span>
            {form.borrower_id && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Borrower #{form.borrower_id}</span>}
            {form.property_id && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Property #{form.property_id}</span>}
            {form.application_id && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Application #{form.application_id}</span>}
            {form.loan_amount && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">${Number(form.loan_amount).toLocaleString()}</span>}
            {form.loan_type && <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full capitalize">{form.loan_type}</span>}
            {form.property_state && <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">{form.property_state}</span>}
            {!form.borrower_id && !form.property_id && !form.application_id && !form.loan_amount && !form.loan_type && !form.property_state && (
              <span className="text-gray-400 italic">No data selected — use dropdowns or quick load buttons above</span>
            )}
            {(form.borrower_id || form.property_id || form.application_id || form.loan_amount) && (
              <button onClick={() => setForm({})} className="text-red-500 hover:text-red-700 ml-auto font-medium">Clear All</button>
            )}
          </div>

          <button onClick={runAnalysis} disabled={loading} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-2.5 rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all font-medium disabled:opacity-50 shadow-md">
            {loading ? '🔄 Analyzing...' : '🚀 Run AI Analysis'}
          </button>
        </div>
      )}

      <AIResultDisplay result={aiResult} loading={loading} />
    </div>
  );
}
