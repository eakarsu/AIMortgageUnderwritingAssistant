const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM properties ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM properties WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { address, city, state, zip, property_type, year_built, square_feet, bedrooms, bathrooms, lot_size, estimated_value, listing_price, zoning, flood_zone, hoa_fee } = req.body;
    const result = await pool.query(
      `INSERT INTO properties (address,city,state,zip,property_type,year_built,square_feet,bedrooms,bathrooms,lot_size,estimated_value,listing_price,zoning,flood_zone,hoa_fee) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [address, city, state, zip, property_type, year_built, square_feet, bedrooms, bathrooms, lot_size, estimated_value, listing_price, zoning, flood_zone || false, hoa_fee || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { address, city, state, zip, property_type, year_built, square_feet, bedrooms, bathrooms, lot_size, estimated_value, listing_price, zoning, flood_zone, hoa_fee } = req.body;
    const result = await pool.query(
      `UPDATE properties SET address=$1,city=$2,state=$3,zip=$4,property_type=$5,year_built=$6,square_feet=$7,bedrooms=$8,bathrooms=$9,lot_size=$10,estimated_value=$11,listing_price=$12,zoning=$13,flood_zone=$14,hoa_fee=$15,updated_at=NOW() WHERE id=$16 RETURNING *`,
      [address, city, state, zip, property_type, year_built, square_feet, bedrooms, bathrooms, lot_size, estimated_value, listing_price, zoning, flood_zone, hoa_fee, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM properties WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
