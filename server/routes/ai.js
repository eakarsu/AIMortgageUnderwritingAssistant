const express = require('express');
const fetch = require('node-fetch');
const pool = require('../db');
const router = express.Router();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

async function callAI(prompt, systemPrompt) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Mortgage Underwriting Assistant',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'AI API error');
  return data.choices[0].message.content;
}

// Helper: parse JSON from AI response, extract first JSON object
function parseAIJson(content) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    return null;
  }
}

// 1. AI Credit Risk Assessment
router.post('/credit-risk', async (req, res) => {
  try {
    const { borrower_id } = req.body;
    const borrower = await pool.query('SELECT * FROM borrowers WHERE id = $1', [borrower_id]);
    const credits = await pool.query('SELECT * FROM credit_reports WHERE borrower_id = $1', [borrower_id]);
    if (borrower.rows.length === 0) return res.status(404).json({ error: 'Borrower not found' });

    const b = borrower.rows[0];
    const cr = credits.rows;
    const prompt = `Analyze credit risk for this mortgage borrower:
- Name: ${b.first_name} ${b.last_name}
- Credit Score: ${b.credit_score}
- Annual Income: $${b.annual_income}
- Monthly Debt: $${b.monthly_debt}
- Employment: ${b.employment_status} at ${b.employer_name}, ${b.years_employed} years
- Credit Reports: ${cr.map(c => `${c.bureau}: Score ${c.score}, ${c.delinquencies} delinquencies, ${c.bankruptcies} bankruptcies, ${c.collections} collections, ${c.total_balance} total balance`).join('; ')}

Return JSON: { "risk_score": <300-850>, "risk_category": "excellent|good|fair|poor", "risk_factors": ["<factor>"], "mitigating_factors": ["<factor>"], "approve_recommendation": <true|false>, "conditions_if_approved": ["<condition>"], "summary": "<brief narrative>" }`;

    const systemPrompt = 'You are an expert mortgage underwriting AI. Provide detailed, professional credit risk assessments. Return ONLY valid JSON — no markdown, no extra text.';
    const rawResult = await callAI(prompt, systemPrompt);
    const structured = parseAIJson(rawResult);
    const result = structured || rawResult;

    await pool.query(
      `INSERT INTO ai_analyses (borrower_id, analysis_type, input_data, result, model_used, status) VALUES ($1, 'credit_risk', $2::jsonb, $3::jsonb, $4, 'completed')`,
      [borrower_id, JSON.stringify({ borrower: b, credit_reports: cr }), JSON.stringify({ analysis: result }), MODEL]
    );

    res.json({ analysis: result, structured: !!structured, borrower: b, credit_reports: cr });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. AI Income Verification Analysis
router.post('/income-verification', async (req, res) => {
  try {
    const { borrower_id } = req.body;
    const borrower = await pool.query('SELECT * FROM borrowers WHERE id = $1', [borrower_id]);
    const income = await pool.query('SELECT * FROM income_records WHERE borrower_id = $1', [borrower_id]);
    if (borrower.rows.length === 0) return res.status(404).json({ error: 'Borrower not found' });

    const b = borrower.rows[0];
    const prompt = `Verify and analyze income for mortgage underwriting:
- Borrower: ${b.first_name} ${b.last_name}
- Stated Annual Income: $${b.annual_income}
- Employment Status: ${b.employment_status}
- Employer: ${b.employer_name}, Title: ${b.job_title}
- Years Employed: ${b.years_employed}
- Income Records: ${income.rows.map(i => `${i.source}: $${i.amount}/${i.frequency} (${i.type}, verified: ${i.verified})`).join('; ')}

Analyze: 1) Income Consistency, 2) Verification Status, 3) Stability Assessment, 4) Qualifying Income Calculation, 5) Red Flags, 6) Recommendation for underwriter.`;

    const systemPrompt = 'You are a mortgage income verification specialist AI. Analyze income documentation for loan qualification. Provide thorough, compliant analysis following Fannie Mae/Freddie Mac guidelines.';
    const result = await callAI(prompt, systemPrompt);
    res.json({ analysis: result, borrower: b, income_records: income.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. AI Property Valuation
router.post('/property-valuation', async (req, res) => {
  try {
    const { property_id } = req.body;
    const property = await pool.query('SELECT * FROM properties WHERE id = $1', [property_id]);
    const appraisals = await pool.query('SELECT * FROM appraisals WHERE property_id = $1', [property_id]);
    if (property.rows.length === 0) return res.status(404).json({ error: 'Property not found' });

    const p = property.rows[0];
    const prompt = `Analyze property valuation for mortgage underwriting:
- Address: ${p.address}, ${p.city}, ${p.state} ${p.zip}
- Type: ${p.property_type}, Built: ${p.year_built}
- Size: ${p.square_feet} sqft, ${p.bedrooms} bed/${p.bathrooms} bath
- Lot: ${p.lot_size} acres
- Estimated Value: $${p.estimated_value}
- Listing Price: $${p.listing_price}
- Flood Zone: ${p.flood_zone}, HOA: $${p.hoa_fee}/mo
- Appraisals: ${appraisals.rows.map(a => `Appraised: $${a.appraised_value}, Market: $${a.market_value}, Condition: ${a.condition_rating}`).join('; ') || 'None'}

Provide: 1) Value Assessment, 2) Market Analysis, 3) Comparable Analysis, 4) Risk Factors (flood, age, condition), 5) Recommended LTV, 6) Valuation Opinion.`;

    const systemPrompt = 'You are a property valuation AI for mortgage underwriting. Analyze properties using appraisal standards and market data. Provide professional valuation opinions.';
    const result = await callAI(prompt, systemPrompt);
    res.json({ analysis: result, property: p, appraisals: appraisals.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. AI Fraud Detection
router.post('/fraud-detection', async (req, res) => {
  try {
    const { application_id } = req.body;
    const app = await pool.query(`
      SELECT la.*, b.first_name, b.last_name, b.annual_income, b.credit_score, b.employment_status,
        p.estimated_value, p.listing_price
      FROM loan_applications la
      LEFT JOIN borrowers b ON la.borrower_id = b.id
      LEFT JOIN properties p ON la.property_id = p.id
      WHERE la.id = $1
    `, [application_id]);
    if (app.rows.length === 0) return res.status(404).json({ error: 'Application not found' });

    const a = app.rows[0];
    const docs = await pool.query('SELECT * FROM documents WHERE application_id = $1', [application_id]);

    const prompt = `Perform fraud detection analysis on this mortgage application:
- Application: ${a.application_number}
- Borrower: ${a.first_name} ${a.last_name}
- Income: $${a.annual_income}, Credit Score: ${a.credit_score}
- Loan Amount: $${a.loan_amount}, Property Value: $${a.estimated_value}
- LTV: ${a.ltv_ratio}%, DTI: ${a.dti_ratio}%
- Purpose: ${a.purpose}
- Documents: ${docs.rows.map(d => `${d.name} (${d.status})`).join(', ')}

Return JSON: { "fraud_risk": "low|medium|high|critical", "fraud_score": <0-100>, "red_flags": ["<flag>"], "verification_required": ["<item>"], "recommendation": "<action>", "reasoning": "<brief explanation>" }`;

    const systemPrompt = 'You are a mortgage fraud detection AI specialist. Analyze applications for common mortgage fraud patterns. Return ONLY valid JSON — no markdown, no extra text.';
    const rawResult = await callAI(prompt, systemPrompt);
    const structured = parseAIJson(rawResult);
    const result = structured || rawResult;
    res.json({ analysis: result, structured: !!structured, application: a });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 5. AI Document Analysis
router.post('/document-analysis', async (req, res) => {
  try {
    const { application_id } = req.body;
    const docs = await pool.query(`
      SELECT d.*, b.first_name || ' ' || b.last_name as borrower_name
      FROM documents d LEFT JOIN borrowers b ON d.borrower_id = b.id
      WHERE d.application_id = $1
    `, [application_id]);
    const app = await pool.query('SELECT * FROM loan_applications WHERE id = $1', [application_id]);

    const prompt = `Analyze document completeness for mortgage application ${app.rows[0]?.application_number}:
Documents on file: ${docs.rows.map(d => `${d.name} (Type: ${d.type}, Status: ${d.status})`).join('; ')}

Evaluate: 1) Document Completeness (what's present vs required), 2) Missing Critical Documents, 3) Document Status Summary, 4) Priority Items Needed, 5) Compliance with documentation requirements, 6) Recommendation for next steps.

Standard required documents include: W2s (2 years), tax returns (2 years), pay stubs (30 days), bank statements (2 months), employment verification, ID, property insurance, title search.`;

    const systemPrompt = 'You are a mortgage document review AI. Analyze loan file completeness and identify missing or problematic documentation. Follow GSE and agency guidelines.';
    const result = await callAI(prompt, systemPrompt);
    res.json({ analysis: result, documents: docs.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. AI DTI Analysis
router.post('/dti-analysis', async (req, res) => {
  try {
    const { borrower_id, loan_amount, interest_rate, term_months } = req.body;
    const borrower = await pool.query('SELECT * FROM borrowers WHERE id = $1', [borrower_id]);
    const income = await pool.query('SELECT * FROM income_records WHERE borrower_id = $1', [borrower_id]);
    if (borrower.rows.length === 0) return res.status(404).json({ error: 'Borrower not found' });

    const b = borrower.rows[0];
    const monthlyRate = (interest_rate || 6.875) / 100 / 12;
    const months = term_months || 360;
    const payment = (loan_amount || 400000) * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

    const prompt = `Calculate and analyze Debt-to-Income ratio for mortgage qualification:
- Borrower: ${b.first_name} ${b.last_name}
- Monthly Gross Income: $${(b.annual_income / 12).toFixed(2)}
- Current Monthly Debts: $${b.monthly_debt}
- Proposed Monthly Mortgage Payment: $${payment.toFixed(2)} (P&I only)
- Estimated Taxes/Insurance: $${(payment * 0.3).toFixed(2)}/mo
- Total Proposed Housing Payment: $${(payment * 1.3).toFixed(2)}/mo
- Income Sources: ${income.rows.map(i => `${i.source}: $${i.amount}/${i.frequency}`).join(', ')}

Calculate: 1) Front-End DTI (housing only), 2) Back-End DTI (total debt), 3) Qualifying Ratios by Loan Type, 4) Compensating Factors, 5) DTI Risk Level, 6) Maximum Affordable Loan Amount, 7) Recommendation.`;

    const systemPrompt = 'You are a mortgage DTI analysis AI. Calculate precise debt-to-income ratios and provide qualification analysis per Fannie Mae, FHA, VA, and USDA guidelines.';
    const result = await callAI(prompt, systemPrompt);
    res.json({ analysis: result, borrower: b, proposed_payment: payment.toFixed(2) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. AI Loan Eligibility
router.post('/loan-eligibility', async (req, res) => {
  try {
    const { borrower_id, property_id } = req.body;
    const borrower = await pool.query('SELECT * FROM borrowers WHERE id = $1', [borrower_id]);
    const property = await pool.query('SELECT * FROM properties WHERE id = $1', [property_id]);
    const products = await pool.query('SELECT * FROM loan_products WHERE is_active = true');
    if (borrower.rows.length === 0) return res.status(404).json({ error: 'Borrower not found' });

    const b = borrower.rows[0];
    const p = property.rows[0] || {};
    const prompt = `Determine loan program eligibility for:
- Borrower: ${b.first_name} ${b.last_name}, Credit Score: ${b.credit_score}
- Income: $${b.annual_income}/year, Monthly Debt: $${b.monthly_debt}
- Employment: ${b.employment_status}, ${b.years_employed} years
- Property: ${p.address || 'TBD'}, Value: $${p.estimated_value || 'TBD'}, Type: ${p.property_type || 'TBD'}

Available Loan Products:
${products.rows.map(lp => `- ${lp.name}: Rate ${lp.interest_rate}%, Min Credit ${lp.min_credit_score}, Max LTV ${lp.max_ltv}%, Max DTI ${lp.max_dti}%, Min Down ${lp.min_down_payment}%`).join('\n')}

For each product: 1) Eligible (Yes/No/Maybe), 2) Why/Why Not, 3) Best Fit Rating (1-10), 4) Estimated Monthly Payment, 5) Required Down Payment.
Then provide: Overall Best Recommendation and Alternative Options.`;

    const systemPrompt = 'You are a mortgage product eligibility AI. Match borrowers to the best loan programs based on their profile. Provide clear eligibility determinations with reasoning.';
    const result = await callAI(prompt, systemPrompt);
    res.json({ analysis: result, borrower: b, property: p, products: products.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 8. AI Compliance Check
router.post('/compliance-review', async (req, res) => {
  try {
    const { application_id } = req.body;
    const app = await pool.query(`
      SELECT la.*, b.first_name, b.last_name, b.credit_score, b.annual_income
      FROM loan_applications la LEFT JOIN borrowers b ON la.borrower_id = b.id
      WHERE la.id = $1
    `, [application_id]);
    const existing = await pool.query('SELECT * FROM compliance_checks WHERE application_id = $1', [application_id]);
    if (app.rows.length === 0) return res.status(404).json({ error: 'Application not found' });

    const a = app.rows[0];
    const prompt = `Perform regulatory compliance review for mortgage application:
- Application: ${a.application_number}
- Borrower: ${a.first_name} ${a.last_name}
- Loan Amount: $${a.loan_amount}, Rate: ${a.interest_rate}%
- LTV: ${a.ltv_ratio}%, DTI: ${a.dti_ratio}%
- Purpose: ${a.purpose}
- Existing Checks: ${existing.rows.map(c => `${c.check_type}: ${c.status} (${c.result || 'pending'})`).join(', ')}

Review against: 1) TRID/TILA-RESPA, 2) HMDA Reporting, 3) Fair Lending/ECOA, 4) QM/ATR Rules, 5) BSA/AML, 6) OFAC Screening, 7) State-specific regulations, 8) Overall Compliance Score, 9) Required Actions.`;

    const systemPrompt = 'You are a mortgage compliance AI specialist. Review loan applications against all applicable federal and state regulations. Identify compliance gaps and required actions.';
    const result = await callAI(prompt, systemPrompt);
    res.json({ analysis: result, application: a, existing_checks: existing.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 9. AI Automated Underwriting Decision
router.post('/underwriting-decision', async (req, res) => {
  try {
    const { application_id } = req.body;
    const app = await pool.query(`
      SELECT la.*, b.first_name, b.last_name, b.credit_score, b.annual_income, b.monthly_debt, b.employment_status, b.years_employed,
        p.address, p.estimated_value, p.property_type, p.flood_zone,
        lp.name as product_name, lp.type as product_type
      FROM loan_applications la
      LEFT JOIN borrowers b ON la.borrower_id = b.id
      LEFT JOIN properties p ON la.property_id = p.id
      LEFT JOIN loan_products lp ON la.loan_product_id = lp.id
      WHERE la.id = $1
    `, [application_id]);
    if (app.rows.length === 0) return res.status(404).json({ error: 'Application not found' });

    const a = app.rows[0];
    const risks = await pool.query('SELECT * FROM risk_assessments WHERE application_id = $1', [application_id]);
    const conditions = await pool.query('SELECT * FROM conditions WHERE application_id = $1', [application_id]);
    const compliance = await pool.query('SELECT * FROM compliance_checks WHERE application_id = $1', [application_id]);

    const prompt = `Make automated underwriting decision for:
- Application: ${a.application_number}
- Borrower: ${a.first_name} ${a.last_name}
- Credit Score: ${a.credit_score}, Income: $${a.annual_income}
- Employment: ${a.employment_status}, ${a.years_employed} years
- Loan: $${a.loan_amount} ${a.product_name} (${a.product_type})
- Property: ${a.address}, Value: $${a.estimated_value}, Type: ${a.property_type}
- LTV: ${a.ltv_ratio}%, DTI: ${a.dti_ratio}%, Rate: ${a.interest_rate}%
- Risk Assessments: ${risks.rows.map(r => `${r.risk_category}: ${r.risk_level} (${r.score})`).join(', ')}
- Conditions: ${conditions.rows.length} total (${conditions.rows.filter(c => c.status === 'pending').length} pending)
- Compliance: ${compliance.rows.map(c => `${c.check_type}: ${c.result || c.status}`).join(', ')}

Return JSON: { "decision": "approve|deny|suspend", "confidence": <0-100>, "rationale": "<explanation>", "conditions": ["<condition>"], "denial_reasons": ["<reason>"], "stipulations": ["<item>"], "risk_summary": "<summary>" }`;

    const systemPrompt = 'You are an automated mortgage underwriting decision engine. Follow DU/LP decision guidelines. Return ONLY valid JSON — no markdown, no extra text.';
    const rawResult = await callAI(prompt, systemPrompt);
    const structured = parseAIJson(rawResult);
    const result = structured || rawResult;

    await pool.query(
      `INSERT INTO ai_analyses (application_id, analysis_type, result, model_used, status) VALUES ($1, 'underwriting_decision', $2::jsonb, $3, 'completed')`,
      [application_id, JSON.stringify({ decision: result }), MODEL]
    );

    res.json({ analysis: result, structured: !!structured, application: a });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 10. AI Risk Scoring
router.post('/risk-score', async (req, res) => {
  try {
    const { application_id } = req.body;
    const app = await pool.query(`
      SELECT la.*, b.first_name, b.last_name, b.credit_score, b.annual_income, b.monthly_debt,
        p.estimated_value, p.flood_zone, p.property_type
      FROM loan_applications la
      LEFT JOIN borrowers b ON la.borrower_id = b.id
      LEFT JOIN properties p ON la.property_id = p.id
      WHERE la.id = $1
    `, [application_id]);
    if (app.rows.length === 0) return res.status(404).json({ error: 'Application not found' });

    const a = app.rows[0];
    const prompt = `Generate comprehensive risk scoring for mortgage application:
- Application: ${a.application_number}
- Credit Score: ${a.credit_score}
- LTV: ${a.ltv_ratio}%, DTI: ${a.dti_ratio}%
- Loan Amount: $${a.loan_amount}
- Property Value: $${a.estimated_value}, Type: ${a.property_type}, Flood Zone: ${a.flood_zone}
- Income: $${a.annual_income}, Monthly Debt: $${a.monthly_debt}

Score each category (0-100, higher=safer):
1) Credit Risk Score, 2) Capacity Risk Score, 3) Collateral Risk Score, 4) Capital Risk Score, 5) Character Risk Score
Then: 6) Composite Risk Score, 7) Risk Grade (A through F), 8) Risk-Based Pricing Adjustment, 9) Monitoring Recommendations.`;

    const systemPrompt = 'You are a mortgage risk scoring AI engine. Calculate precise risk scores across the 5 Cs of credit. Provide quantitative scores with qualitative analysis.';
    const result = await callAI(prompt, systemPrompt);
    res.json({ analysis: result, application: a });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 11. AI Market Analysis
router.post('/market-analysis', async (req, res) => {
  try {
    const { property_id } = req.body;
    const property = await pool.query('SELECT * FROM properties WHERE id = $1', [property_id]);
    if (property.rows.length === 0) return res.status(404).json({ error: 'Property not found' });

    const p = property.rows[0];
    const prompt = `Provide real estate market analysis for mortgage underwriting:
- Location: ${p.city}, ${p.state} ${p.zip}
- Property: ${p.property_type}, ${p.square_feet} sqft, Built ${p.year_built}
- Listed: $${p.listing_price}, Estimated: $${p.estimated_value}

Analyze: 1) Local Market Conditions, 2) Price Trends (appreciation/depreciation), 3) Supply/Demand Dynamics, 4) Employment/Economic Factors, 5) Comparable Market Activity, 6) Market Risk Level, 7) 12-Month Outlook, 8) Impact on Collateral Risk.`;

    const systemPrompt = 'You are a real estate market analysis AI for mortgage underwriting. Provide data-driven market assessments that inform collateral risk decisions.';
    const result = await callAI(prompt, systemPrompt);
    res.json({ analysis: result, property: p });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 12. AI Fee Estimator
router.post('/fee-estimate', async (req, res) => {
  try {
    const { loan_amount, loan_type, property_state } = req.body;
    const fees = await pool.query('SELECT * FROM fee_schedules WHERE is_active = true');

    const prompt = `Estimate closing costs and fees for mortgage:
- Loan Amount: $${loan_amount || 500000}
- Loan Type: ${loan_type || 'conventional'}
- Property State: ${property_state || 'TX'}
- Available Fee Schedule:
${fees.rows.map(f => `  - ${f.name}: ${f.is_percentage ? f.amount + '%' : '$' + f.amount} (${f.category})`).join('\n')}

Calculate: 1) Itemized Fee Breakdown, 2) Total Closing Costs, 3) Cash to Close Estimate, 4) Monthly Payment Breakdown (P&I, Tax, Insurance, PMI), 5) APR Estimate, 6) Cost Comparison by Loan Type, 7) Ways to Reduce Costs.`;

    const systemPrompt = 'You are a mortgage fee estimation AI. Calculate precise closing costs and provide transparent fee breakdowns following TRID requirements.';
    const result = await callAI(prompt, systemPrompt);
    res.json({ analysis: result, fees: fees.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 13. AI Borrower Profile Analysis
router.post('/borrower-profile', async (req, res) => {
  try {
    const { borrower_id } = req.body;
    const b = (await pool.query('SELECT * FROM borrowers WHERE id = $1', [borrower_id])).rows[0];
    if (!b) return res.status(404).json({ error: 'Borrower not found' });
    const income = await pool.query('SELECT * FROM income_records WHERE borrower_id = $1', [borrower_id]);
    const credits = await pool.query('SELECT * FROM credit_reports WHERE borrower_id = $1', [borrower_id]);
    const apps = await pool.query('SELECT * FROM loan_applications WHERE borrower_id = $1', [borrower_id]);

    const prompt = `Generate a comprehensive borrower profile analysis:
- Name: ${b.first_name} ${b.last_name}, DOB: ${b.date_of_birth}
- Address: ${b.address}, ${b.city}, ${b.state} ${b.zip}
- Employment: ${b.employment_status} at ${b.employer_name}, ${b.job_title}, ${b.years_employed} years
- Income: $${b.annual_income}/year, Monthly Debt: $${b.monthly_debt}
- Credit Score: ${b.credit_score}
- Income Records: ${income.rows.map(i => `${i.source}: $${i.amount}/${i.frequency} (${i.type})`).join('; ')}
- Credit Reports: ${credits.rows.map(c => `${c.bureau}: ${c.score}, ${c.delinquencies} delinq, ${c.total_balance} bal`).join('; ')}
- Applications: ${apps.rows.length} total

Provide: 1) Borrower Strength Rating (A-F), 2) Financial Health Summary, 3) Employment Stability, 4) Debt Management Assessment, 5) Credit Utilization, 6) Reserves Analysis, 7) Red Flags, 8) Strengths, 9) Recommendations for Loan Officer.`;

    const result = await callAI(prompt, 'You are a mortgage borrower analysis AI. Create comprehensive borrower profiles for underwriting. Assess overall borrower quality.');
    res.json({ analysis: result, borrower: b });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 14. AI Appraisal Review
router.post('/appraisal-review', async (req, res) => {
  try {
    const { property_id } = req.body;
    const p = (await pool.query('SELECT * FROM properties WHERE id = $1', [property_id])).rows[0];
    if (!p) return res.status(404).json({ error: 'Property not found' });
    const appraisals = await pool.query('SELECT * FROM appraisals WHERE property_id = $1', [property_id]);

    const prompt = `Review appraisal reports for mortgage underwriting:
- Property: ${p.address}, ${p.city}, ${p.state} ${p.zip}
- Type: ${p.property_type}, Built: ${p.year_built}, ${p.square_feet} sqft
- ${p.bedrooms} bed/${p.bathrooms} bath, Lot: ${p.lot_size} acres
- Estimated Value: $${p.estimated_value}, Listing Price: $${p.listing_price}
- Flood Zone: ${p.flood_zone}, HOA: $${p.hoa_fee}/mo
- Appraisals: ${appraisals.rows.map(a => `Appraiser: ${a.appraiser_name} (Lic: ${a.appraiser_license}), Date: ${a.appraisal_date}, Value: $${a.appraised_value}, Market: $${a.market_value}, Condition: ${a.condition_rating}, Comps: ${JSON.stringify(a.comparable_sales)}`).join(' | ') || 'No appraisals on file'}

Analyze: 1) Appraisal Quality & Completeness, 2) Value Reconciliation (appraised vs listing vs market), 3) Comparable Sales Adequacy, 4) Condition Assessment Reasonableness, 5) Red Flags or Concerns, 6) Value Trending, 7) Insurance Requirements, 8) Recommendation (Accept/Request Revision/Order New).`;

    const result = await callAI(prompt, 'You are a mortgage appraisal review AI. Evaluate appraisal reports for accuracy, completeness, and compliance with USPAP standards.');
    res.json({ analysis: result, property: p, appraisals: appraisals.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 15. AI Condition Generator
router.post('/condition-generator', async (req, res) => {
  try {
    const { application_id } = req.body;
    const app = await pool.query(`
      SELECT la.*, b.first_name, b.last_name, b.credit_score, b.employment_status, b.annual_income,
        p.property_type, p.flood_zone, lp.name as product_name, lp.type as product_type
      FROM loan_applications la
      LEFT JOIN borrowers b ON la.borrower_id = b.id
      LEFT JOIN properties p ON la.property_id = p.id
      LEFT JOIN loan_products lp ON la.loan_product_id = lp.id
      WHERE la.id = $1
    `, [application_id]);
    if (app.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    const a = app.rows[0];
    const existing = await pool.query('SELECT * FROM conditions WHERE application_id = $1', [application_id]);
    const docs = await pool.query('SELECT * FROM documents WHERE application_id = $1', [application_id]);

    const prompt = `Generate recommended underwriting conditions for:
- Application: ${a.application_number}, Product: ${a.product_name} (${a.product_type})
- Borrower: ${a.first_name} ${a.last_name}, Credit: ${a.credit_score}, Employment: ${a.employment_status}
- Loan: $${a.loan_amount}, LTV: ${a.ltv_ratio}%, DTI: ${a.dti_ratio}%
- Property Type: ${a.property_type}, Flood Zone: ${a.flood_zone}
- Existing Conditions: ${existing.rows.map(c => `${c.category}: ${c.description} (${c.status})`).join('; ') || 'None'}
- Documents: ${docs.rows.map(d => `${d.name} (${d.status})`).join(', ') || 'None'}

Generate: 1) Prior-to-Approval Conditions (with priority), 2) Prior-to-Closing Conditions (with priority), 3) Prior-to-Funding Conditions, 4) Missing Documentation Requirements, 5) Special Conditions based on loan type, 6) Timeline Recommendations.`;

    const result = await callAI(prompt, 'You are a mortgage condition generation AI. Create comprehensive, appropriate loan conditions based on application specifics. Follow agency guidelines.');
    res.json({ analysis: result, application: a });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 16. AI Audit Anomaly Detection
router.post('/audit-anomaly', async (req, res) => {
  try {
    const logs = await pool.query(`
      SELECT al.*, u.full_name as user_name FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 50
    `);

    const prompt = `Analyze these mortgage system audit logs for anomalies and suspicious patterns:
${logs.rows.map(l => `[${l.created_at}] User: ${l.user_name} | Action: ${l.action} | Entity: ${l.entity_type} #${l.entity_id} | Changes: ${JSON.stringify(l.new_values)}`).join('\n')}

Detect: 1) Unusual Activity Patterns, 2) Rapid Status Changes, 3) After-Hours Activity, 4) Unauthorized Access Attempts, 5) Data Manipulation Concerns, 6) Workflow Violations, 7) User Behavior Anomalies, 8) Risk Score (0-100), 9) Recommended Actions.`;

    const result = await callAI(prompt, 'You are a mortgage system security and audit AI. Analyze audit trails for anomalies, policy violations, and potential fraud indicators.');
    res.json({ analysis: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 17. AI Pipeline Optimizer
router.post('/pipeline-optimizer', async (req, res) => {
  try {
    const apps = await pool.query(`
      SELECT la.*, b.first_name || ' ' || b.last_name as borrower_name
      FROM loan_applications la LEFT JOIN borrowers b ON la.borrower_id = b.id
      ORDER BY la.created_at DESC
    `);
    const stages = await pool.query('SELECT * FROM pipeline_stages ORDER BY display_order');
    const conditions = await pool.query(`SELECT application_id, COUNT(*) as total, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending FROM conditions GROUP BY application_id`);

    const prompt = `Optimize the mortgage loan pipeline:
- Total Applications: ${apps.rows.length}
- By Status: ${Object.entries(apps.rows.reduce((acc, a) => { acc[a.status] = (acc[a.status]||0)+1; return acc; }, {})).map(([k,v]) => `${k}: ${v}`).join(', ')}
- By Priority: ${Object.entries(apps.rows.reduce((acc, a) => { acc[a.priority] = (acc[a.priority]||0)+1; return acc; }, {})).map(([k,v]) => `${k}: ${v}`).join(', ')}
- Pipeline Stages: ${stages.rows.map(s => `${s.name} (avg ${s.avg_days} days)`).join(' -> ')}
- Conditions Pending: ${conditions.rows.map(c => `App#${c.application_id}: ${c.pending}/${c.total}`).join(', ')}

Applications Detail:
${apps.rows.slice(0,15).map(a => `${a.application_number}: $${a.loan_amount}, Status: ${a.status}, Priority: ${a.priority}, DTI: ${a.dti_ratio}%`).join('\n')}

Provide: 1) Bottleneck Analysis, 2) Priority Reordering Suggestions, 3) Resource Allocation Recommendations, 4) SLA Risk (apps likely to miss targets), 5) Quick Wins (apps close to approval), 6) At-Risk Applications, 7) Workflow Improvement Suggestions, 8) Capacity Planning.`;

    const result = await callAI(prompt, 'You are a mortgage pipeline optimization AI. Analyze workflow bottlenecks, suggest priority changes, and improve loan processing efficiency.');
    res.json({ analysis: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 18. AI Rule Suggestion
router.post('/rule-suggestion', async (req, res) => {
  try {
    const rules = await pool.query('SELECT * FROM underwriting_rules ORDER BY category');
    const apps = await pool.query(`
      SELECT la.status, la.ltv_ratio, la.dti_ratio, b.credit_score, la.loan_amount
      FROM loan_applications la LEFT JOIN borrowers b ON la.borrower_id = b.id
    `);

    const prompt = `Analyze current underwriting rules and suggest improvements:
Current Rules:
${rules.rows.map(r => `- ${r.name} [${r.category}]: ${r.condition_field} ${r.operator} ${r.threshold_value} -> ${r.action} (${r.severity}, Active: ${r.is_active})`).join('\n')}

Application Portfolio Stats:
- Total: ${apps.rows.length}
- Avg Credit Score: ${(apps.rows.reduce((s,a) => s + (parseInt(a.credit_score)||0), 0) / apps.rows.length).toFixed(0)}
- Avg LTV: ${(apps.rows.reduce((s,a) => s + (parseFloat(a.ltv_ratio)||0), 0) / apps.rows.length).toFixed(1)}%
- Avg DTI: ${(apps.rows.reduce((s,a) => s + (parseFloat(a.dti_ratio)||0), 0) / apps.rows.length).toFixed(1)}%
- Status Distribution: ${Object.entries(apps.rows.reduce((acc, a) => { acc[a.status] = (acc[a.status]||0)+1; return acc; }, {})).map(([k,v]) => `${k}: ${v}`).join(', ')}

Suggest: 1) Missing Rules That Should Be Added, 2) Rules That Should Be Updated, 3) Threshold Optimization, 4) New Risk-Based Rules, 5) Compliance Gap Rules, 6) Performance-Based Adjustments, 7) Priority of Changes.`;

    const result = await callAI(prompt, 'You are a mortgage underwriting rules optimization AI. Analyze rule sets, identify gaps, and suggest data-driven improvements to underwriting guidelines.');
    res.json({ analysis: result, current_rules: rules.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 19. AI Loan Product Advisor
router.post('/product-advisor', async (req, res) => {
  try {
    const { borrower_id } = req.body;
    const b = (await pool.query('SELECT * FROM borrowers WHERE id = $1', [borrower_id])).rows[0];
    if (!b) return res.status(404).json({ error: 'Borrower not found' });
    const products = await pool.query('SELECT * FROM loan_products WHERE is_active = true');

    const prompt = `Act as a loan product advisor for this borrower:
- Name: ${b.first_name} ${b.last_name}
- Credit Score: ${b.credit_score}
- Annual Income: $${b.annual_income}, Monthly Debt: $${b.monthly_debt}
- Employment: ${b.employment_status} at ${b.employer_name}, ${b.years_employed} years
- Location: ${b.city}, ${b.state}

Available Products:
${products.rows.map(p => `- ${p.name} (${p.type}): ${p.interest_rate}% rate, ${p.min_credit_score} min credit, ${p.max_ltv}% max LTV, ${p.max_dti}% max DTI, ${p.min_down_payment}% min down, ${p.term_months}mo term`).join('\n')}

Provide: 1) Top 3 Best-Fit Products with reasoning, 2) Monthly Payment Comparison, 3) Total Cost Over Life of Loan, 4) Down Payment Requirements, 5) Pros/Cons of Each Option, 6) Special Programs Eligibility (first-time buyer, veteran, rural), 7) Rate Negotiation Tips, 8) Personalized Recommendation.`;

    const result = await callAI(prompt, 'You are a mortgage loan product advisor AI. Help borrowers find the optimal loan product. Consider all factors including rates, costs, eligibility, and long-term financial impact.');
    res.json({ analysis: result, borrower: b, products: products.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 20. AI Notification Intelligence
router.post('/notification-intelligence', async (req, res) => {
  try {
    const apps = await pool.query(`
      SELECT la.*, b.first_name || ' ' || b.last_name as borrower_name
      FROM loan_applications la LEFT JOIN borrowers b ON la.borrower_id = b.id
    `);
    const conditions = await pool.query(`SELECT c.*, la.application_number FROM conditions c LEFT JOIN loan_applications la ON c.application_id = la.id WHERE c.status != 'completed'`);
    const docs = await pool.query(`SELECT d.*, la.application_number FROM documents d LEFT JOIN loan_applications la ON d.application_id = la.id WHERE d.status = 'pending_review'`);
    const compliance = await pool.query(`SELECT * FROM compliance_checks WHERE status = 'pending' OR result = 'fail'`);

    const prompt = `Generate smart notification priorities for the mortgage underwriting team:
- Active Applications: ${apps.rows.filter(a => !['approved','denied'].includes(a.status)).length}
- Urgent Apps: ${apps.rows.filter(a => a.priority === 'urgent').map(a => a.application_number).join(', ') || 'None'}
- Pending Conditions: ${conditions.rows.length} (${conditions.rows.filter(c => c.priority === 'high').length} high priority)
- Overdue Conditions: ${conditions.rows.filter(c => new Date(c.due_date) < new Date()).map(c => `${c.application_number}: ${c.description}`).join('; ') || 'None'}
- Documents Awaiting Review: ${docs.rows.length}
- Failed/Pending Compliance: ${compliance.rows.map(c => `App#${c.application_id}: ${c.check_type} (${c.status})`).join('; ') || 'None'}

Generate: 1) Critical Alerts (action required immediately), 2) High Priority Notifications, 3) Upcoming Deadlines, 4) Workflow Reminders, 5) Compliance Warnings, 6) Team Workload Alerts, 7) Suggested Follow-ups, 8) Daily Summary.`;

    const result = await callAI(prompt, 'You are a mortgage workflow intelligence AI. Generate smart, prioritized notifications to keep the underwriting team efficient and compliant.');
    res.json({ analysis: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 21. AI User Workload Analysis
router.post('/workload-analysis', async (req, res) => {
  try {
    const users = await pool.query('SELECT id, full_name, role FROM users');
    const apps = await pool.query('SELECT assigned_underwriter_id, status, priority, loan_amount FROM loan_applications');

    const workload = users.rows.map(u => {
      const assigned = apps.rows.filter(a => a.assigned_underwriter_id === u.id);
      return { ...u, total: assigned.length, in_review: assigned.filter(a => a.status === 'in_review').length, urgent: assigned.filter(a => a.priority === 'urgent').length, volume: assigned.reduce((s,a) => s + parseFloat(a.loan_amount || 0), 0) };
    });

    const prompt = `Analyze team workload distribution for mortgage underwriting:
${workload.map(w => `- ${w.full_name} (${w.role}): ${w.total} apps assigned, ${w.in_review} in review, ${w.urgent} urgent, $${(w.volume/1000000).toFixed(1)}M volume`).join('\n')}

Total Pipeline: ${apps.rows.length} applications
By Status: ${Object.entries(apps.rows.reduce((acc, a) => { acc[a.status]=(acc[a.status]||0)+1; return acc; }, {})).map(([k,v]) => `${k}: ${v}`).join(', ')}

Analyze: 1) Workload Balance Assessment, 2) Overloaded Team Members, 3) Underutilized Resources, 4) Reassignment Recommendations, 5) Capacity by Complexity, 6) Estimated Processing Time per User, 7) Bottleneck Risks, 8) Staffing Recommendations.`;

    const result = await callAI(prompt, 'You are a mortgage operations management AI. Analyze team workload distribution and recommend optimal resource allocation.');
    res.json({ analysis: result, workload });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 22. AI Insurance Requirements
router.post('/insurance-requirements', async (req, res) => {
  try {
    const { property_id, application_id } = req.body;
    const p = (await pool.query('SELECT * FROM properties WHERE id = $1', [property_id])).rows[0];
    const app = application_id ? (await pool.query('SELECT la.*, lp.type as product_type, lp.name as product_name FROM loan_applications la LEFT JOIN loan_products lp ON la.loan_product_id = lp.id WHERE la.id = $1', [application_id])).rows[0] : null;
    if (!p) return res.status(404).json({ error: 'Property not found' });

    const prompt = `Determine insurance requirements for mortgage:
- Property: ${p.address}, ${p.city}, ${p.state} ${p.zip}
- Type: ${p.property_type}, Built: ${p.year_built}, ${p.square_feet} sqft
- Value: $${p.estimated_value}, Flood Zone: ${p.flood_zone}, HOA: $${p.hoa_fee}
${app ? `- Loan: $${app.loan_amount}, LTV: ${app.ltv_ratio}%, Product: ${app.product_name} (${app.product_type})` : ''}

Determine: 1) Homeowners Insurance (required coverage, estimated cost), 2) Flood Insurance (required? NFIP vs private, estimated cost), 3) PMI/MIP Requirements (when, how much, how to remove), 4) Title Insurance (lender's vs owner's), 5) Wind/Hurricane Insurance (if coastal), 6) Earthquake Insurance (if applicable), 7) Umbrella Policy Recommendation, 8) HOA Master Policy Adequacy, 9) Total Monthly Insurance Estimate, 10) Cost Reduction Tips.`;

    const result = await callAI(prompt, 'You are a mortgage insurance requirements AI. Determine all necessary insurance for mortgage approval. Provide comprehensive coverage analysis.');
    res.json({ analysis: result, property: p });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 23. AI Comparable Sales Analysis
router.post('/comparable-sales', async (req, res) => {
  try {
    const { property_id } = req.body;
    const p = (await pool.query('SELECT * FROM properties WHERE id = $1', [property_id])).rows[0];
    if (!p) return res.status(404).json({ error: 'Property not found' });
    const nearby = await pool.query('SELECT * FROM properties WHERE state = $1 AND id != $2', [p.state, property_id]);
    const appraisals = await pool.query('SELECT * FROM appraisals WHERE property_id = $1', [property_id]);

    const prompt = `Perform comparable sales analysis for:
- Subject: ${p.address}, ${p.city}, ${p.state} ${p.zip}
- Type: ${p.property_type}, ${p.square_feet} sqft, ${p.bedrooms}bd/${p.bathrooms}ba
- Built: ${p.year_built}, Lot: ${p.lot_size} acres
- Listed: $${p.listing_price}, Estimated: $${p.estimated_value}
- Price/sqft: $${(p.listing_price / p.square_feet).toFixed(0)}

Nearby Properties in ${p.state}:
${nearby.rows.slice(0,8).map(n => `- ${n.address}, ${n.city}: ${n.property_type}, ${n.square_feet}sqft, ${n.bedrooms}bd/${n.bathrooms}ba, Built ${n.year_built}, $${n.estimated_value} ($${(n.estimated_value/n.square_feet).toFixed(0)}/sqft)`).join('\n')}

Appraisal Comps: ${appraisals.rows.map(a => JSON.stringify(a.comparable_sales)).join('; ') || 'None'}

Analyze: 1) Best Comparable Properties, 2) Adjustment Analysis (size, age, features, location), 3) Price Per Square Foot Comparison, 4) Market Value Range, 5) Value Conclusion, 6) Confidence Level, 7) Adjustments Needed, 8) Supporting/Contradicting Evidence.`;

    const result = await callAI(prompt, 'You are a real estate comparable sales analysis AI. Perform detailed CMA analysis for mortgage underwriting using USPAP-aligned methodology.');
    res.json({ analysis: result, property: p, nearby: nearby.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 24. AI Rate Lock Advisory
router.post('/rate-lock-advisory', async (req, res) => {
  try {
    const { application_id } = req.body;
    const app = await pool.query(`
      SELECT la.*, lp.name as product_name, lp.interest_rate as product_rate, lp.type as product_type
      FROM loan_applications la LEFT JOIN loan_products lp ON la.loan_product_id = lp.id
      WHERE la.id = $1
    `, [application_id]);
    if (app.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    const a = app.rows[0];

    const prompt = `Provide rate lock advisory for mortgage application:
- Application: ${a.application_number}
- Current Rate: ${a.interest_rate}%
- Product: ${a.product_name} (${a.product_type}), Base Rate: ${a.product_rate}%
- Loan Amount: $${a.loan_amount}, Term: ${a.term_months} months
- LTV: ${a.ltv_ratio}%, Status: ${a.status}

Advise on: 1) Lock Now vs Float Recommendation, 2) Rate Environment Analysis, 3) Lock Period Recommendation (15/30/45/60 days), 4) Cost of Lock Extension, 5) Float-Down Option Analysis, 6) Payment Impact of Rate Changes (+/- 0.25%), 7) Break-Even Analysis, 8) Risk of Waiting, 9) Best Timing Strategy.`;

    const result = await callAI(prompt, 'You are a mortgage rate lock advisory AI. Provide strategic rate lock recommendations considering market conditions, loan timeline, and borrower goals.');
    res.json({ analysis: result, application: a });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 25. AI Portfolio Risk Analysis
router.post('/portfolio-risk', async (req, res) => {
  try {
    const apps = await pool.query(`
      SELECT la.*, b.credit_score, p.state as property_state, p.property_type, lp.type as product_type
      FROM loan_applications la
      LEFT JOIN borrowers b ON la.borrower_id = b.id
      LEFT JOIN properties p ON la.property_id = p.id
      LEFT JOIN loan_products lp ON la.loan_product_id = lp.id
    `);

    const totalVolume = apps.rows.reduce((s,a) => s + parseFloat(a.loan_amount||0), 0);
    const prompt = `Analyze the mortgage loan portfolio risk:
- Total Loans: ${apps.rows.length}, Total Volume: $${(totalVolume/1000000).toFixed(1)}M
- By Product Type: ${Object.entries(apps.rows.reduce((acc,a) => { acc[a.product_type]=(acc[a.product_type]||0)+1; return acc; }, {})).map(([k,v]) => `${k}: ${v}`).join(', ')}
- By State: ${Object.entries(apps.rows.reduce((acc,a) => { acc[a.property_state]=(acc[a.property_state]||0)+1; return acc; }, {})).map(([k,v]) => `${k}: ${v}`).join(', ')}
- Avg Credit Score: ${(apps.rows.reduce((s,a) => s+(parseInt(a.credit_score)||0), 0)/apps.rows.length).toFixed(0)}
- Avg LTV: ${(apps.rows.reduce((s,a) => s+(parseFloat(a.ltv_ratio)||0), 0)/apps.rows.length).toFixed(1)}%
- Avg DTI: ${(apps.rows.reduce((s,a) => s+(parseFloat(a.dti_ratio)||0), 0)/apps.rows.length).toFixed(1)}%
- High LTV (>90%): ${apps.rows.filter(a => parseFloat(a.ltv_ratio)>90).length}
- High DTI (>43%): ${apps.rows.filter(a => parseFloat(a.dti_ratio)>43).length}
- Low Credit (<680): ${apps.rows.filter(a => parseInt(a.credit_score)<680).length}

Analyze: 1) Geographic Concentration Risk, 2) Product Mix Risk, 3) Credit Quality Distribution, 4) LTV Distribution Risk, 5) Interest Rate Exposure, 6) Default Probability Estimate, 7) Stress Test Scenarios, 8) Diversification Recommendations, 9) Portfolio Health Score (0-100).`;

    const result = await callAI(prompt, 'You are a mortgage portfolio risk management AI. Analyze aggregate portfolio risk, concentration exposure, and provide strategic recommendations.');
    res.json({ analysis: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// Apply pass 4 (mechanical backlog)
// 503 when OPENROUTER_API_KEY is unset.
// ============================================================
const requireKey = (res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    res.status(503).json({ error: 'AI service not configured', message: 'OPENROUTER_API_KEY is not set' });
    return false;
  }
  return true;
};

// 26. AI Title Risk Assessment
router.post('/title-risk-assessment', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const { property_id, application_id, title_notes } = req.body || {};
    let property = null, application = null;
    if (property_id) {
      const r = await pool.query('SELECT * FROM properties WHERE id = $1', [property_id]);
      property = r.rows[0] || null;
    }
    if (application_id) {
      const r = await pool.query('SELECT * FROM loan_applications WHERE id = $1', [application_id]);
      application = r.rows[0] || null;
    }
    if (!property && !title_notes) {
      return res.status(400).json({ error: 'property_id or title_notes is required' });
    }

    const prompt = `Assess title risk for this mortgage transaction:
- Property: ${property ? `${property.address}, ${property.city}, ${property.state} ${property.zip}; type ${property.property_type}; built ${property.year_built}; est value $${property.estimated_value}` : 'N/A'}
- Application: ${application ? `${application.application_number}; loan $${application.loan_amount}; LTV ${application.ltv_ratio}%` : 'N/A'}
- Title notes / preliminary report excerpt: ${title_notes || 'none provided'}

Return JSON: { "risk_level": "low|medium|high", "title_issues": ["..."], "liens_or_encumbrances": ["..."], "required_endorsements": ["..."], "title_insurance_recommendation": "...", "clear_to_close_obstacles": ["..."], "summary": "..." }`;

    const systemPrompt = 'You are a title risk assessment specialist for mortgage underwriting. Identify liens, encumbrances, chain-of-title concerns, and required endorsements. Return ONLY valid JSON.';
    const rawResult = await callAI(prompt, systemPrompt);
    const structured = parseAIJson(rawResult);
    res.json({ analysis: structured || rawResult, structured: !!structured, property, application });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 27. AI Closing Readiness
router.post('/closing-readiness', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const { application_id } = req.body || {};
    if (!application_id) return res.status(400).json({ error: 'application_id is required' });

    const app = await pool.query('SELECT * FROM loan_applications WHERE id = $1', [application_id]);
    if (app.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    const a = app.rows[0];

    let conditions = { rows: [] };
    let documents = { rows: [] };
    try { conditions = await pool.query('SELECT * FROM conditions WHERE application_id = $1', [application_id]); } catch {}
    try { documents = await pool.query('SELECT * FROM documents WHERE application_id = $1', [application_id]); } catch {}

    const openConditions = conditions.rows.filter(c => c.status && c.status !== 'cleared' && c.status !== 'satisfied');

    const prompt = `Assess closing readiness for this mortgage application:
- Application: ${a.application_number}; status ${a.status}; loan $${a.loan_amount}; LTV ${a.ltv_ratio}%; DTI ${a.dti_ratio}%
- Total conditions: ${conditions.rows.length}; open: ${openConditions.length}
- Open condition list: ${openConditions.slice(0,15).map(c => `[${c.status}] ${c.description || c.condition_text || c.type}`).join('; ') || 'none'}
- Document count: ${documents.rows.length}

Return JSON: { "ready_to_close": true|false, "readiness_score": 0-100, "outstanding_items": ["..."], "blocking_items": ["..."], "recommended_next_steps": ["..."], "estimated_days_to_close": 0, "summary": "..." }`;

    const systemPrompt = 'You are a closing coordination AI. Assess whether a mortgage is ready to close, list outstanding conditions and blockers, and recommend next steps. Return ONLY valid JSON.';
    const rawResult = await callAI(prompt, systemPrompt);
    const structured = parseAIJson(rawResult);
    res.json({ analysis: structured || rawResult, structured: !!structured, application: a, open_conditions: openConditions.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// Apply pass 5 — remaining backlog
// ============================================================

// PRODUCT-DECISION: /asset-verification overlaps with /document-analysis but
// the audit explicitly listed it as a missing feature. Default chosen here:
// expose a dedicated endpoint that focuses ONLY on bank-statement / brokerage /
// retirement-asset confirmation — it does NOT replace document-analysis. Output
// shape is dedicated to liquid-asset evaluation (sufficiency for down payment,
// reserves, sourcing of funds, large-deposit explanations).
// 28. AI Asset Verification
router.post('/asset-verification', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const { borrower_id, application_id, assets, statements_summary } = req.body || {};
    let borrower = null, application = null;
    if (borrower_id) {
      const r = await pool.query('SELECT * FROM borrowers WHERE id = $1', [borrower_id]);
      borrower = r.rows[0] || null;
    }
    if (application_id) {
      const r = await pool.query('SELECT * FROM loan_applications WHERE id = $1', [application_id]);
      application = r.rows[0] || null;
    }
    if (!borrower && !assets && !statements_summary) {
      return res.status(400).json({ error: 'borrower_id, assets[], or statements_summary is required' });
    }

    const prompt = `Verify borrower's liquid assets for mortgage qualification:
- Borrower: ${borrower ? `${borrower.first_name} ${borrower.last_name}; income $${borrower.annual_income}` : 'N/A'}
- Application: ${application ? `loan $${application.loan_amount}; LTV ${application.ltv_ratio}%; down-payment requirement implied` : 'N/A'}
- Declared assets: ${Array.isArray(assets) ? JSON.stringify(assets) : 'none provided'}
- Statements summary: ${statements_summary || 'none'}

Return JSON: { "verified_total_usd": 0, "sufficient_for_down_payment": true|false, "reserves_months": 0, "large_deposits_to_source": ["..."], "asset_breakdown": {"checking":0,"savings":0,"brokerage":0,"retirement":0,"other":0}, "verification_concerns": ["..."], "recommended_documentation": ["..."], "summary": "..." }`;

    const systemPrompt = 'You are an asset-verification underwriter. Confirm sufficiency of borrower liquid assets for down payment + reserves, flag large/unsourced deposits, and recommend documentation. Return ONLY valid JSON.';
    const rawResult = await callAI(prompt, systemPrompt);
    const structured = parseAIJson(rawResult);
    res.json({ analysis: structured || rawResult, structured: !!structured, borrower, application });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PRODUCT-DECISION: /employment-verification overlaps with /income-verification
// but the audit explicitly listed it as a missing feature. Default chosen
// here: produce an EMPLOYMENT-only verification (employer confirmation,
// VOE-style fields, length-of-employment risk, gaps, 4506-T need) and let
// /income-verification keep ownership of pay-stub / W-2 income calculation.
// 29. AI Employment Verification
router.post('/employment-verification', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const { borrower_id, application_id, voe_text, employer_phone } = req.body || {};
    let borrower = null, application = null;
    if (borrower_id) {
      const r = await pool.query('SELECT * FROM borrowers WHERE id = $1', [borrower_id]);
      borrower = r.rows[0] || null;
    }
    if (application_id) {
      const r = await pool.query('SELECT * FROM loan_applications WHERE id = $1', [application_id]);
      application = r.rows[0] || null;
    }
    if (!borrower && !voe_text) {
      return res.status(400).json({ error: 'borrower_id or voe_text is required' });
    }

    const prompt = `Perform employment verification analysis (VOE) for a mortgage borrower:
- Borrower: ${borrower ? `${borrower.first_name} ${borrower.last_name}; employer ${borrower.employer_name}; ${borrower.years_employed} years; status ${borrower.employment_status}` : 'N/A'}
- Application: ${application ? `${application.application_number}; loan $${application.loan_amount}` : 'N/A'}
- VOE / verification text: ${voe_text || 'none provided'}
- Employer phone: ${employer_phone || 'none'}

Return JSON: { "employment_verified": true|false, "tenure_years": 0, "tenure_risk": "low|medium|high", "employment_gaps": ["..."], "voe_concerns": ["..."], "needs_4506t": true|false, "needs_written_voe": true|false, "needs_verbal_voe": true|false, "summary": "..." }`;

    const systemPrompt = 'You are an employment-verification underwriter. Focus ONLY on employment status, tenure, gaps, and VOE documentation needs (NOT income calculation — that is the income-verification endpoint\'s job). Return ONLY valid JSON.';
    const rawResult = await callAI(prompt, systemPrompt);
    const structured = parseAIJson(rawResult);
    res.json({ analysis: structured || rawResult, structured: !!structured, borrower, application });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
