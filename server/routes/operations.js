const express = require('express');
const pool = require('../db');

const router = express.Router();

const modules = [
  { key: 'disclosure-packages', name: 'Disclosure Packages' },
  { key: 'los-integrations', name: 'LOS Integrations' },
  { key: 'credit-bureau-pulls', name: 'Credit Bureau Pulls' },
  { key: 'aus-findings', name: 'AUS Findings' },
  { key: 'title-vendor-integrations', name: 'Title Vendor Integrations' },
  { key: 'task-work-queue', name: 'Task Work Queue' },
  { key: 'closing-funding', name: 'Closing & Funding' },
  { key: 'post-close-qc', name: 'Post-Close QC' },
  { key: 'hmda-lar-export', name: 'HMDA/LAR Export' },
  { key: 'role-permissions', name: 'Role Permissions' },
  { key: 'document-storage-viewer', name: 'Document Storage Viewer' },
  { key: 'error-monitoring', name: 'Error Monitoring' },
];

function isValidModule(moduleKey) {
  return modules.some((module) => module.key === moduleKey);
}

const baseSelect = `
  SELECT mor.*,
    u.full_name AS owner_name,
    la.application_number,
    b.first_name || ' ' || b.last_name AS borrower_name,
    p.address AS property_address,
    p.state AS property_state
  FROM mortgage_operation_records mor
  LEFT JOIN users u ON mor.owner_id = u.id
  LEFT JOIN loan_applications la ON mor.application_id = la.id
  LEFT JOIN borrowers b ON mor.borrower_id = b.id
  LEFT JOIN properties p ON mor.property_id = p.id
`;

router.get('/modules', (req, res) => {
  res.json(modules);
});

router.get('/:moduleKey', async (req, res) => {
  try {
    const { moduleKey } = req.params;
    if (!isValidModule(moduleKey)) return res.status(404).json({ error: 'Unknown operations module' });

    const result = await pool.query(
      `${baseSelect}
       WHERE mor.module_key = $1
       ORDER BY
         CASE mor.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
         mor.due_date NULLS LAST,
         mor.created_at DESC`,
      [moduleKey]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:moduleKey/:id', async (req, res) => {
  try {
    const { moduleKey, id } = req.params;
    if (!isValidModule(moduleKey)) return res.status(404).json({ error: 'Unknown operations module' });

    const result = await pool.query(`${baseSelect} WHERE mor.module_key = $1 AND mor.id = $2`, [moduleKey, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:moduleKey', async (req, res) => {
  try {
    const { moduleKey } = req.params;
    if (!isValidModule(moduleKey)) return res.status(404).json({ error: 'Unknown operations module' });

    const {
      title,
      status,
      priority,
      owner_id,
      application_id,
      borrower_id,
      property_id,
      due_date,
      system_ref,
      amount,
      notes,
      metadata,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO mortgage_operation_records
        (module_key,title,status,priority,owner_id,application_id,borrower_id,property_id,due_date,system_ref,amount,notes,metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
       RETURNING *`,
      [
        moduleKey,
        title,
        status || 'open',
        priority || 'medium',
        owner_id || null,
        application_id || null,
        borrower_id || null,
        property_id || null,
        due_date || null,
        system_ref || null,
        amount || null,
        notes || null,
        JSON.stringify(metadata || {}),
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:moduleKey/:id', async (req, res) => {
  try {
    const { moduleKey, id } = req.params;
    if (!isValidModule(moduleKey)) return res.status(404).json({ error: 'Unknown operations module' });

    const {
      title,
      status,
      priority,
      owner_id,
      application_id,
      borrower_id,
      property_id,
      due_date,
      system_ref,
      amount,
      notes,
      metadata,
    } = req.body;

    const result = await pool.query(
      `UPDATE mortgage_operation_records
       SET title=$1,status=$2,priority=$3,owner_id=$4,application_id=$5,borrower_id=$6,property_id=$7,
           due_date=$8,system_ref=$9,amount=$10,notes=$11,metadata=$12::jsonb,updated_at=NOW()
       WHERE module_key=$13 AND id=$14
       RETURNING *`,
      [
        title,
        status,
        priority,
        owner_id || null,
        application_id || null,
        borrower_id || null,
        property_id || null,
        due_date || null,
        system_ref || null,
        amount || null,
        notes || null,
        JSON.stringify(metadata || {}),
        moduleKey,
        id,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:moduleKey/:id', async (req, res) => {
  try {
    const { moduleKey, id } = req.params;
    if (!isValidModule(moduleKey)) return res.status(404).json({ error: 'Unknown operations module' });
    await pool.query('DELETE FROM mortgage_operation_records WHERE module_key = $1 AND id = $2', [moduleKey, id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
