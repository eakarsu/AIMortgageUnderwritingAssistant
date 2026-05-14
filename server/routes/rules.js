const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM underwriting_rules ORDER BY category, name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM underwriting_rules WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, condition_field, operator, threshold_value, action, severity, description } = req.body;
    const result = await pool.query(
      `INSERT INTO underwriting_rules (name,category,condition_field,operator,threshold_value,action,severity,description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, category, condition_field, operator, threshold_value, action, severity || 'warning', description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, condition_field, operator, threshold_value, action, severity, description, is_active } = req.body;
    const result = await pool.query(
      `UPDATE underwriting_rules SET name=$1,category=$2,condition_field=$3,operator=$4,threshold_value=$5,action=$6,severity=$7,description=$8,is_active=$9,updated_at=NOW() WHERE id=$10 RETURNING *`,
      [name, category, condition_field, operator, threshold_value, action, severity, description, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM underwriting_rules WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Rules engine: evaluate all active rules against an application
router.post('/evaluate/:applicationId', async (req, res) => {
  try {
    const appResult = await pool.query(`
      SELECT la.*, b.credit_score, b.annual_income, b.monthly_debt, b.employment_status, b.years_employed,
        p.estimated_value, p.property_type, p.flood_zone
      FROM loan_applications la
      LEFT JOIN borrowers b ON la.borrower_id = b.id
      LEFT JOIN properties p ON la.property_id = p.id
      WHERE la.id = $1
    `, [req.params.applicationId]);
    if (appResult.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    const a = appResult.rows[0];

    const rulesResult = await pool.query('SELECT * FROM underwriting_rules WHERE is_active = true ORDER BY category');
    const rules = rulesResult.rows;

    // Build a flat context object from application + joins
    const ctx = {
      credit_score: parseFloat(a.credit_score) || 0,
      annual_income: parseFloat(a.annual_income) || 0,
      monthly_debt: parseFloat(a.monthly_debt) || 0,
      loan_amount: parseFloat(a.loan_amount) || 0,
      down_payment: parseFloat(a.down_payment) || 0,
      ltv_ratio: parseFloat(a.ltv_ratio) || 0,
      dti: parseFloat(a.dti_ratio) || 0,
      dti_ratio: parseFloat(a.dti_ratio) || 0,
      interest_rate: parseFloat(a.interest_rate) || 0,
      term_months: parseFloat(a.term_months) || 0,
      estimated_value: parseFloat(a.estimated_value) || 0,
      years_employed: parseFloat(a.years_employed) || 0,
      employment_status: a.employment_status || '',
      property_type: a.property_type || '',
      flood_zone: a.flood_zone || '',
    };

    function evaluate(rule) {
      const field = rule.condition_field;
      const threshold = parseFloat(rule.threshold_value);
      const value = parseFloat(ctx[field]);
      if (isNaN(value)) return null; // field not numeric — skip
      switch (rule.operator) {
        case '>':  return value > threshold;
        case '>=': return value >= threshold;
        case '<':  return value < threshold;
        case '<=': return value <= threshold;
        case '==': return value === threshold;
        case '!=': return value !== threshold;
        default:   return null;
      }
    }

    const passed_rules = [];
    const failed_rules = [];
    const conditions_generated = [];

    for (const rule of rules) {
      const result = evaluate(rule);
      if (result === null) continue; // skip non-applicable
      if (result) {
        // Rule triggered (condition is true = fail for error rules, pass for positive rules)
        if (rule.action === 'deny' || rule.severity === 'error') {
          failed_rules.push({ rule, reason: `${rule.condition_field} ${rule.operator} ${rule.threshold_value} triggered (value: ${ctx[rule.condition_field]})` });
          conditions_generated.push(`${rule.name}: ${rule.description || rule.action}`);
        } else if (rule.action === 'flag_review' || rule.severity === 'warning') {
          failed_rules.push({ rule, reason: `Warning: ${rule.condition_field} ${rule.operator} ${rule.threshold_value}` });
        } else {
          passed_rules.push(rule);
        }
      } else {
        passed_rules.push(rule);
      }
    }

    const errorCount = failed_rules.filter(f => f.rule.severity === 'error' || f.rule.action === 'deny').length;
    const warningCount = failed_rules.filter(f => f.rule.severity === 'warning').length;
    let auto_decision = 'approve';
    if (errorCount > 0) auto_decision = 'deny';
    else if (warningCount > 0) auto_decision = 'review';

    res.json({ passed_rules, failed_rules, auto_decision, conditions_generated, summary: { total_rules: rules.length, passed: passed_rules.length, failed: failed_rules.length, errors: errorCount, warnings: warningCount } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
