const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM loan_applications');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(`
      SELECT la.*, b.first_name || ' ' || b.last_name as borrower_name, b.credit_score,
        p.address as property_address, p.city as property_city, p.state as property_state,
        lp.name as product_name
      FROM loan_applications la
      LEFT JOIN borrowers b ON la.borrower_id = b.id
      LEFT JOIN properties p ON la.property_id = p.id
      LEFT JOIN loan_products lp ON la.loan_product_id = lp.id
      ORDER BY la.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    res.json({ data: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT la.*, b.first_name || ' ' || b.last_name as borrower_name, b.credit_score, b.annual_income, b.monthly_debt,
        p.address as property_address, p.city as property_city, p.state as property_state, p.estimated_value,
        lp.name as product_name, u.full_name as underwriter_name
      FROM loan_applications la
      LEFT JOIN borrowers b ON la.borrower_id = b.id
      LEFT JOIN properties p ON la.property_id = p.id
      LEFT JOIN loan_products lp ON la.loan_product_id = lp.id
      LEFT JOIN users u ON la.assigned_underwriter_id = u.id
      WHERE la.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { borrower_id, property_id, loan_product_id, loan_amount, down_payment, ltv_ratio, dti_ratio, interest_rate, term_months, purpose, status, priority, assigned_underwriter_id } = req.body;
    const countResult = await pool.query('SELECT COUNT(*) FROM loan_applications');
    const num = parseInt(countResult.rows[0].count) + 1;
    const application_number = `APP-2024-${String(num).padStart(3, '0')}`;
    const result = await pool.query(
      `INSERT INTO loan_applications (application_number,borrower_id,property_id,loan_product_id,loan_amount,down_payment,ltv_ratio,dti_ratio,interest_rate,term_months,purpose,status,priority,assigned_underwriter_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [application_number, borrower_id, property_id, loan_product_id, loan_amount, down_payment, ltv_ratio, dti_ratio, interest_rate, term_months, purpose, status || 'submitted', priority || 'normal', assigned_underwriter_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { borrower_id, property_id, loan_product_id, loan_amount, down_payment, ltv_ratio, dti_ratio, interest_rate, term_months, purpose, status, priority, assigned_underwriter_id, decision, decision_notes } = req.body;
    const result = await pool.query(
      `UPDATE loan_applications SET borrower_id=$1,property_id=$2,loan_product_id=$3,loan_amount=$4,down_payment=$5,ltv_ratio=$6,dti_ratio=$7,interest_rate=$8,term_months=$9,purpose=$10,status=$11,priority=$12,assigned_underwriter_id=$13,decision=$14,decision_notes=$15,updated_at=NOW() WHERE id=$16 RETURNING *`,
      [borrower_id, property_id, loan_product_id, loan_amount, down_payment, ltv_ratio, dti_ratio, interest_rate, term_months, purpose, status, priority, assigned_underwriter_id, decision, decision_notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM loan_applications WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Advance pipeline stage with AI guidance
router.put('/:id/advance-stage', async (req, res) => {
  try {
    const fetch = require('node-fetch');
    const appResult = await pool.query(`
      SELECT la.*, b.first_name, b.last_name, b.credit_score, b.annual_income,
        p.address, p.estimated_value, ps.name as current_stage_name
      FROM loan_applications la
      LEFT JOIN borrowers b ON la.borrower_id = b.id
      LEFT JOIN properties p ON la.property_id = p.id
      LEFT JOIN pipeline_stages ps ON la.pipeline_stage_id = ps.id
      WHERE la.id = $1
    `, [req.params.id]);
    if (appResult.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    const a = appResult.rows[0];
    const stages = await pool.query('SELECT * FROM pipeline_stages ORDER BY display_order');

    const prompt = `Given this mortgage application's current status and data, what is the next logical pipeline stage?
Application: ${a.application_number}, Status: ${a.status}, Current Stage: ${a.current_stage_name || 'Unknown'}
Borrower: ${a.first_name} ${a.last_name}, Credit: ${a.credit_score}, Income: $${a.annual_income}
Loan: $${a.loan_amount}, LTV: ${a.ltv_ratio}%, DTI: ${a.dti_ratio}%
Available Stages: ${stages.rows.map(s => s.name).join(', ')}

Return JSON: { "next_stage": "<stage name from available list>", "readiness_score": <0-100>, "blocking_conditions": ["<condition>"], "checklist": ["<item>"] }`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
        messages: [
          { role: 'system', content: 'You are a mortgage pipeline stage advisor. Return ONLY valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    let parsed;
    try {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : content);
    } catch { parsed = { next_stage: null, readiness_score: 0, blocking_conditions: [], checklist: [] }; }

    // Find next stage id
    const nextStage = stages.rows.find(s => s.name?.toLowerCase() === parsed.next_stage?.toLowerCase());
    if (nextStage) {
      await pool.query('UPDATE loan_applications SET pipeline_stage_id = $1, updated_at = NOW() WHERE id = $2', [nextStage.id, req.params.id]);
    }

    res.json({ new_stage: parsed.next_stage, stage_id: nextStage?.id, ai_guidance: parsed });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
