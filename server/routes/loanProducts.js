const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM loan_products ORDER BY name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM loan_products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, interest_rate, min_credit_score, max_ltv, max_dti, min_down_payment, term_months, description } = req.body;
    const result = await pool.query(
      `INSERT INTO loan_products (name,type,interest_rate,min_credit_score,max_ltv,max_dti,min_down_payment,term_months,description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, type, interest_rate, min_credit_score, max_ltv, max_dti, min_down_payment, term_months, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, type, interest_rate, min_credit_score, max_ltv, max_dti, min_down_payment, term_months, description, is_active } = req.body;
    const result = await pool.query(
      `UPDATE loan_products SET name=$1,type=$2,interest_rate=$3,min_credit_score=$4,max_ltv=$5,max_dti=$6,min_down_payment=$7,term_months=$8,description=$9,is_active=$10,updated_at=NOW() WHERE id=$11 RETURNING *`,
      [name, type, interest_rate, min_credit_score, max_ltv, max_dti, min_down_payment, term_months, description, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM loan_products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
