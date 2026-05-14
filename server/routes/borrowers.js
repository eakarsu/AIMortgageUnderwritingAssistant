const express = require('express');
const pool = require('../db');
const router = express.Router();

// Mask SSN — never return full SSN, only ssn_last4
function maskBorrower(b) {
  const { ssn, ...safe } = b;
  return safe;
}

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM borrowers');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      'SELECT id,first_name,last_name,email,phone,ssn_last4,date_of_birth,address,city,state,zip,employment_status,employer_name,job_title,years_employed,annual_income,monthly_debt,credit_score,created_at,updated_at FROM borrowers ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({ data: result.rows.map(maskBorrower), total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id,first_name,last_name,email,phone,ssn_last4,date_of_birth,address,city,state,zip,employment_status,employer_name,job_title,years_employed,annual_income,monthly_debt,credit_score,created_at,updated_at FROM borrowers WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(maskBorrower(result.rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, ssn_last4, date_of_birth, address, city, state, zip, employment_status, employer_name, job_title, years_employed, annual_income, monthly_debt, credit_score } = req.body;
    const result = await pool.query(
      `INSERT INTO borrowers (first_name,last_name,email,phone,ssn_last4,date_of_birth,address,city,state,zip,employment_status,employer_name,job_title,years_employed,annual_income,monthly_debt,credit_score) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id,first_name,last_name,email,phone,ssn_last4,date_of_birth,address,city,state,zip,employment_status,employer_name,job_title,years_employed,annual_income,monthly_debt,credit_score,created_at`,
      [first_name, last_name, email, phone, ssn_last4, date_of_birth, address, city, state, zip, employment_status, employer_name, job_title, years_employed, annual_income, monthly_debt, credit_score]
    );
    res.status(201).json(maskBorrower(result.rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, ssn_last4, date_of_birth, address, city, state, zip, employment_status, employer_name, job_title, years_employed, annual_income, monthly_debt, credit_score } = req.body;
    const result = await pool.query(
      `UPDATE borrowers SET first_name=$1,last_name=$2,email=$3,phone=$4,ssn_last4=$5,date_of_birth=$6,address=$7,city=$8,state=$9,zip=$10,employment_status=$11,employer_name=$12,job_title=$13,years_employed=$14,annual_income=$15,monthly_debt=$16,credit_score=$17,updated_at=NOW() WHERE id=$18 RETURNING id,first_name,last_name,email,phone,ssn_last4,date_of_birth,address,city,state,zip,employment_status,employer_name,job_title,years_employed,annual_income,monthly_debt,credit_score,updated_at`,
      [first_name, last_name, email, phone, ssn_last4, date_of_birth, address, city, state, zip, employment_status, employer_name, job_title, years_employed, annual_income, monthly_debt, credit_score, req.params.id]
    );
    res.json(maskBorrower(result.rows[0]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM borrowers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
