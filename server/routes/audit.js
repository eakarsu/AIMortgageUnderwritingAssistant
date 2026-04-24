const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT al.*, u.full_name as user_name
      FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT al.*, u.full_name as user_name
      FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { user_id, action, entity_type, entity_id, old_values, new_values } = req.body;
    const result = await pool.query(
      `INSERT INTO audit_logs (user_id,action,entity_type,entity_id,old_values,new_values) VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb) RETURNING *`,
      [user_id, action, entity_type, entity_id, old_values ? JSON.stringify(old_values) : null, new_values ? JSON.stringify(new_values) : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM audit_logs WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
