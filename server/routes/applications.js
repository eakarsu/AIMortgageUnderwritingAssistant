const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT la.*, b.first_name || ' ' || b.last_name as borrower_name, b.credit_score,
        p.address as property_address, p.city as property_city, p.state as property_state,
        lp.name as product_name
      FROM loan_applications la
      LEFT JOIN borrowers b ON la.borrower_id = b.id
      LEFT JOIN properties p ON la.property_id = p.id
      LEFT JOIN loan_products lp ON la.loan_product_id = lp.id
      ORDER BY la.created_at DESC
    `);
    res.json(result.rows);
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

module.exports = router;
