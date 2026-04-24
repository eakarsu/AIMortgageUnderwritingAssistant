const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const stages = await pool.query('SELECT * FROM pipeline_stages ORDER BY display_order');
    const apps = await pool.query(`
      SELECT la.id, la.application_number, la.status, la.loan_amount, la.priority,
        b.first_name || ' ' || b.last_name as borrower_name
      FROM loan_applications la
      LEFT JOIN borrowers b ON la.borrower_id = b.id
      ORDER BY la.created_at DESC
    `);
    res.json({ stages: stages.rows, applications: apps.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pipeline_stages ORDER BY display_order');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
