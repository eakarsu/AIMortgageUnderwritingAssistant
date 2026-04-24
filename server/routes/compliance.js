const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cc.*, la.application_number
      FROM compliance_checks cc
      LEFT JOIN loan_applications la ON cc.application_id = la.id
      ORDER BY cc.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cc.*, la.application_number
      FROM compliance_checks cc LEFT JOIN loan_applications la ON cc.application_id = la.id
      WHERE cc.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { application_id, check_type, regulation, status, result: checkResult, details } = req.body;
    const dbResult = await pool.query(
      `INSERT INTO compliance_checks (application_id,check_type,regulation,status,result,details) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [application_id, check_type, regulation, status || 'pending', checkResult, details]
    );
    res.status(201).json(dbResult.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { application_id, check_type, regulation, status, result: checkResult, details } = req.body;
    const dbResult = await pool.query(
      `UPDATE compliance_checks SET application_id=$1,check_type=$2,regulation=$3,status=$4,result=$5,details=$6,updated_at=NOW() WHERE id=$7 RETURNING *`,
      [application_id, check_type, regulation, status, checkResult, details, req.params.id]
    );
    res.json(dbResult.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM compliance_checks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
