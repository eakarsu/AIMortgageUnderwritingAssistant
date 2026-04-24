const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, la.application_number
      FROM conditions c
      LEFT JOIN loan_applications la ON c.application_id = la.id
      ORDER BY c.due_date ASC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, la.application_number
      FROM conditions c LEFT JOIN loan_applications la ON c.application_id = la.id
      WHERE c.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { application_id, category, description, type, priority, status, due_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO conditions (application_id,category,description,type,priority,status,due_date,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [application_id, category, description, type || 'prior_to_closing', priority || 'medium', status || 'pending', due_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { application_id, category, description, type, priority, status, due_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE conditions SET application_id=$1,category=$2,description=$3,type=$4,priority=$5,status=$6,due_date=$7,notes=$8,updated_at=NOW() WHERE id=$9 RETURNING *`,
      [application_id, category, description, type, priority, status, due_date, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM conditions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
