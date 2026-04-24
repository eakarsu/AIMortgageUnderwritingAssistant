const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fee_schedules ORDER BY category, name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fee_schedules WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, amount, is_percentage, applies_to, description } = req.body;
    const result = await pool.query(
      `INSERT INTO fee_schedules (name,category,amount,is_percentage,applies_to,description) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, category, amount, is_percentage || false, applies_to, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, amount, is_percentage, applies_to, description, is_active } = req.body;
    const result = await pool.query(
      `UPDATE fee_schedules SET name=$1,category=$2,amount=$3,is_percentage=$4,applies_to=$5,description=$6,is_active=$7,updated_at=NOW() WHERE id=$8 RETURNING *`,
      [name, category, amount, is_percentage, applies_to, description, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM fee_schedules WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
