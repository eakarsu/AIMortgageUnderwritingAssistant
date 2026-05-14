const express = require('express');
const multer = require('multer');
const fs = require('fs');
const fetch = require('node-fetch');
const pool = require('../db');
const router = express.Router();

const upload = multer({ dest: '/tmp/mortgage-uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM documents');
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(`
      SELECT d.*, b.first_name || ' ' || b.last_name as borrower_name, la.application_number
      FROM documents d
      LEFT JOIN borrowers b ON d.borrower_id = b.id
      LEFT JOIN loan_applications la ON d.application_id = la.id
      ORDER BY d.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    res.json({ data: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
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

// Document OCR — upload file and extract financial data via AI vision
router.post('/:id/ocr', upload.single('file'), async (req, res) => {
  try {
    const docResult = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (docResult.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    const doc = docResult.rows[0];

    let base64Data = null;
    let mimeType = 'image/jpeg';

    if (req.file) {
      const fileBuffer = fs.readFileSync(req.file.path);
      base64Data = fileBuffer.toString('base64');
      mimeType = req.file.mimetype || 'image/jpeg';
      // Clean up temp file
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }

    const systemPrompt = 'You are a financial document OCR AI for mortgage underwriting. Extract all financial data from the provided document. Return ONLY valid JSON.';
    const userContent = base64Data
      ? [
          { type: 'text', text: `Extract all financial data from this document (pay stub/W-2/bank statement). Return JSON: { "document_type": "", "employer_name": "", "employee_name": "", "gross_income": null, "net_income": null, "pay_period": "", "ytd_earnings": null, "dates_covered": "", "confidence_score": 0 }` },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
        ]
      : `Extract financial data from document named "${doc.name}" (type: ${doc.type}). Return JSON: { "document_type": "${doc.type}", "employer_name": "", "employee_name": "", "gross_income": null, "net_income": null, "pay_period": "", "ytd_earnings": null, "dates_covered": "", "confidence_score": 50, "note": "No file uploaded; using document metadata only" }`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Mortgage Underwriting Assistant',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || 'AI API error');
    const content = data.choices[0].message.content;
    let extracted;
    try {
      const match = content.match(/\{[\s\S]*\}/);
      extracted = JSON.parse(match ? match[0] : content);
    } catch { extracted = { raw_response: content, confidence_score: 0 }; }

    // Update income_records if gross_income extracted and borrower linked
    if (doc.borrower_id && extracted.gross_income) {
      await pool.query(
        `INSERT INTO income_records (borrower_id, source, type, amount, frequency, verified, notes) VALUES ($1, $2, 'employment', $3, 'monthly', false, $4)
         ON CONFLICT DO NOTHING`,
        [doc.borrower_id, extracted.employer_name || 'Extracted', extracted.gross_income, `OCR extracted from document ${doc.id}`]
      ).catch(() => {});
    }

    // Mark document as reviewed
    await pool.query(`UPDATE documents SET status='approved', notes=$1, updated_at=NOW() WHERE id=$2`, [
      `OCR confidence: ${extracted.confidence_score}%`, req.params.id
    ]);

    res.json({ extracted, document: doc, model: data.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
