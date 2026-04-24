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

module.exports = router;
