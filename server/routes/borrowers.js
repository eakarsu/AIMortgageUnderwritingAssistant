const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM borrowers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM borrowers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, ssn_last4, date_of_birth, address, city, state, zip, employment_status, employer_name, job_title, years_employed, annual_income, monthly_debt, credit_score } = req.body;
    const result = await pool.query(
      `INSERT INTO borrowers (first_name,last_name,email,phone,ssn_last4,date_of_birth,address,city,state,zip,employment_status,employer_name,job_title,years_employed,annual_income,monthly_debt,credit_score) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [first_name, last_name, email, phone, ssn_last4, date_of_birth, address, city, state, zip, employment_status, employer_name, job_title, years_employed, annual_income, monthly_debt, credit_score]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, ssn_last4, date_of_birth, address, city, state, zip, employment_status, employer_name, job_title, years_employed, annual_income, monthly_debt, credit_score } = req.body;
    const result = await pool.query(
      `UPDATE borrowers SET first_name=$1,last_name=$2,email=$3,phone=$4,ssn_last4=$5,date_of_birth=$6,address=$7,city=$8,state=$9,zip=$10,employment_status=$11,employer_name=$12,job_title=$13,years_employed=$14,annual_income=$15,monthly_debt=$16,credit_score=$17,updated_at=NOW() WHERE id=$18 RETURNING *`,
      [first_name, last_name, email, phone, ssn_last4, date_of_birth, address, city, state, zip, employment_status, employer_name, job_title, years_employed, annual_income, monthly_debt, credit_score, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM borrowers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
