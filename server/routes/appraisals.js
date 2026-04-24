const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, p.address as property_address, p.city as property_city, la.application_number
      FROM appraisals a
      LEFT JOIN properties p ON a.property_id = p.id
      LEFT JOIN loan_applications la ON a.application_id = la.id
      ORDER BY a.appraisal_date DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, p.address as property_address, p.city as property_city, p.state as property_state, la.application_number
      FROM appraisals a
      LEFT JOIN properties p ON a.property_id = p.id
      LEFT JOIN loan_applications la ON a.application_id = la.id
      WHERE a.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { property_id, application_id, appraiser_name, appraiser_license, appraisal_date, appraised_value, market_value, condition_rating, notes, status } = req.body;
    const result = await pool.query(
      `INSERT INTO appraisals (property_id,application_id,appraiser_name,appraiser_license,appraisal_date,appraised_value,market_value,condition_rating,notes,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [property_id, application_id, appraiser_name, appraiser_license, appraisal_date, appraised_value, market_value, condition_rating, notes, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { property_id, application_id, appraiser_name, appraiser_license, appraisal_date, appraised_value, market_value, condition_rating, notes, status } = req.body;
    const result = await pool.query(
      `UPDATE appraisals SET property_id=$1,application_id=$2,appraiser_name=$3,appraiser_license=$4,appraisal_date=$5,appraised_value=$6,market_value=$7,condition_rating=$8,notes=$9,status=$10,updated_at=NOW() WHERE id=$11 RETURNING *`,
      [property_id, application_id, appraiser_name, appraiser_license, appraisal_date, appraised_value, market_value, condition_rating, notes, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM appraisals WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
