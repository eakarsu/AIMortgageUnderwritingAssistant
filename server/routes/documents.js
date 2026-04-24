const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, b.first_name || ' ' || b.last_name as borrower_name, la.application_number
      FROM documents d
      LEFT JOIN borrowers b ON d.borrower_id = b.id
      LEFT JOIN loan_applications la ON d.application_id = la.id
      ORDER BY d.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, b.first_name || ' ' || b.last_name as borrower_name, la.application_number
      FROM documents d
      LEFT JOIN borrowers b ON d.borrower_id = b.id
      LEFT JOIN loan_applications la ON d.application_id = la.id
      WHERE d.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { application_id, borrower_id, name, type, file_path, file_size, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO documents (application_id,borrower_id,name,type,file_path,file_size,status,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [application_id, borrower_id, name, type, file_path, file_size, status || 'pending_review', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, type, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE documents SET name=$1,type=$2,status=$3,notes=$4,updated_at=NOW() WHERE id=$5 RETURNING *`,
      [name, type, status, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
