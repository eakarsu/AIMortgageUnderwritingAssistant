const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const [apps, borrowers, totalVolume, pendingConditions, riskHigh, docsReview] = await Promise.all([
      pool.query(`SELECT status, COUNT(*) as count FROM loan_applications GROUP BY status`),
      pool.query(`SELECT COUNT(*) as count FROM borrowers`),
      pool.query(`SELECT COALESCE(SUM(loan_amount), 0) as total FROM loan_applications`),
      pool.query(`SELECT COUNT(*) as count FROM conditions WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*) as count FROM risk_assessments WHERE risk_level = 'high'`),
      pool.query(`SELECT COUNT(*) as count FROM documents WHERE status = 'pending_review'`),
    ]);

    const statusCounts = {};
    apps.rows.forEach(r => { statusCounts[r.status] = parseInt(r.count); });

    res.json({
      total_applications: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      status_breakdown: statusCounts,
      total_borrowers: parseInt(borrowers.rows[0].count),
      total_loan_volume: parseFloat(totalVolume.rows[0].total),
      pending_conditions: parseInt(pendingConditions.rows[0].count),
      high_risk_count: parseInt(riskHigh.rows[0].count),
      docs_pending_review: parseInt(docsReview.rows[0].count),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
