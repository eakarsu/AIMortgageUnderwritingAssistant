const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ra.*, la.application_number
      FROM risk_assessments ra
      LEFT JOIN loan_applications la ON ra.application_id = la.id
      ORDER BY ra.assessed_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ra.*, la.application_number
      FROM risk_assessments ra LEFT JOIN loan_applications la ON ra.application_id = la.id
      WHERE ra.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { application_id, risk_category, risk_level, score, factors, recommendation, assessed_by } = req.body;
    const result = await pool.query(
      `INSERT INTO risk_assessments (application_id,risk_category,risk_level,score,factors,recommendation,assessed_by) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7) RETURNING *`,
      [application_id, risk_category, risk_level, score, JSON.stringify(factors), recommendation, assessed_by || 'Manual']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { application_id, risk_category, risk_level, score, factors, recommendation, assessed_by } = req.body;
    const result = await pool.query(
      `UPDATE risk_assessments SET application_id=$1,risk_category=$2,risk_level=$3,score=$4,factors=$5::jsonb,recommendation=$6,assessed_by=$7,updated_at=NOW() WHERE id=$8 RETURNING *`,
      [application_id, risk_category, risk_level, score, JSON.stringify(factors), recommendation, assessed_by, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM risk_assessments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
