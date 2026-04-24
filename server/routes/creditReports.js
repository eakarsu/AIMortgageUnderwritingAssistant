const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cr.*, b.first_name || ' ' || b.last_name as borrower_name
      FROM credit_reports cr
      LEFT JOIN borrowers b ON cr.borrower_id = b.id
      ORDER BY cr.report_date DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cr.*, b.first_name || ' ' || b.last_name as borrower_name
      FROM credit_reports cr LEFT JOIN borrowers b ON cr.borrower_id = b.id
      WHERE cr.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { borrower_id, bureau, score, report_date, total_accounts, open_accounts, total_balance, monthly_payments, delinquencies, bankruptcies, collections, inquiries_last_6months, oldest_account_years } = req.body;
    const result = await pool.query(
      `INSERT INTO credit_reports (borrower_id,bureau,score,report_date,total_accounts,open_accounts,total_balance,monthly_payments,delinquencies,bankruptcies,collections,inquiries_last_6months,oldest_account_years) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [borrower_id, bureau, score, report_date, total_accounts, open_accounts, total_balance, monthly_payments, delinquencies || 0, bankruptcies || 0, collections || 0, inquiries_last_6months || 0, oldest_account_years]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { borrower_id, bureau, score, report_date, total_accounts, open_accounts, total_balance, monthly_payments, delinquencies, bankruptcies, collections, inquiries_last_6months, oldest_account_years } = req.body;
    const result = await pool.query(
      `UPDATE credit_reports SET borrower_id=$1,bureau=$2,score=$3,report_date=$4,total_accounts=$5,open_accounts=$6,total_balance=$7,monthly_payments=$8,delinquencies=$9,bankruptcies=$10,collections=$11,inquiries_last_6months=$12,oldest_account_years=$13,updated_at=NOW() WHERE id=$14 RETURNING *`,
      [borrower_id, bureau, score, report_date, total_accounts, open_accounts, total_balance, monthly_payments, delinquencies, bankruptcies, collections, inquiries_last_6months, oldest_account_years, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM credit_reports WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
