const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = require('./db');
const { authenticateToken } = require('./middleware/auth');
const { aiRateLimiter, generalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const borrowerRoutes = require('./routes/borrowers');
const applicationRoutes = require('./routes/applications');
const propertyRoutes = require('./routes/properties');
const documentRoutes = require('./routes/documents');
const loanProductRoutes = require('./routes/loanProducts');
const creditReportRoutes = require('./routes/creditReports');
const incomeRoutes = require('./routes/income');
const appraisalRoutes = require('./routes/appraisals');
const feeRoutes = require('./routes/fees');
const conditionRoutes = require('./routes/conditions');
const complianceRoutes = require('./routes/compliance');
const riskRoutes = require('./routes/risk');
const auditRoutes = require('./routes/audit');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');
const ruleRoutes = require('./routes/rules');
const pipelineRoutes = require('./routes/pipeline');
const aiRoutes = require('./routes/ai');
const dashboardRoutes = require('./routes/dashboard');
const operationsRoutes = require('./routes/operations');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(helmet());
app.use(cors({origin:process.env.CLIENT_URL||'http://localhost:3000',credentials:true}));
app.use(express.json());
app.use(generalLimiter);

// Audit log middleware — writes every mutating request to audit_logs
async function auditLog(req, res, next) {
  res.on('finish', async () => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && res.statusCode < 400) {
      try {
        await pool.query(
          'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1,$2,$3,$4,$5,$6)',
          [
            req.user?.id || null,
            req.method,
            req.path.split('/')[1] || req.path,
            req.params?.id || null,
            JSON.stringify(req.body).slice(0, 500),
            req.ip,
          ]
        );
      } catch (e) { /* silent — audit must never break requests */ }
    }
  });
  next();
}
app.use(auditLog);

// Public routes
app.use('/api/auth', authRoutes);

// Protected resource routes
app.use('/api/borrowers', authenticateToken, borrowerRoutes);
app.use('/api/applications', authenticateToken, applicationRoutes);
app.use('/api/properties', authenticateToken, propertyRoutes);
app.use('/api/documents', authenticateToken, documentRoutes);
app.use('/api/loan-products', authenticateToken, loanProductRoutes);
app.use('/api/credit-reports', authenticateToken, creditReportRoutes);
app.use('/api/income', authenticateToken, incomeRoutes);
app.use('/api/appraisals', authenticateToken, appraisalRoutes);
app.use('/api/fees', authenticateToken, feeRoutes);
app.use('/api/conditions', authenticateToken, conditionRoutes);
app.use('/api/compliance', authenticateToken, complianceRoutes);
app.use('/api/risk', authenticateToken, riskRoutes);
app.use('/api/audit', authenticateToken, auditRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/rules', authenticateToken, ruleRoutes);
app.use('/api/pipeline', authenticateToken, pipelineRoutes);
app.use('/api/ai', authenticateToken, aiRateLimiter, aiRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/operations', authenticateToken, operationsRoutes);
app.use('/api/compensating-factor-matrix', authenticateToken, require('./routes/compensatingFactorMatrix'));
app.use('/api/mortgage-workflow', authenticateToken, require('./routes/mortgageWorkflow'));

app.use(/^\/api\/(?:gap-|underwriting-orchestrator|vision-document-intel|pipeline-bottleneck-agent|realtime-fraud-stream|borrower-engagement)/, (req,res,next) => {
  if (process.env.ENABLE_EXPERIMENTAL_ROUTES === 'true') return next();
  return res.status(501).json({error:'Generated/provider-backed surface is quarantined',required:'ENABLE_EXPERIMENTAL_ROUTES=true plus documented provider configuration'});
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Mortgage Underwriting Server running on port ${PORT}`);
});

// === BATCH 05 AUTO-MOUNT (custom feature suggestions) ===
app.use('/api/underwriting-orchestrator', require('./routes/underwriting-orchestrator'));
app.use('/api/vision-document-intel', require('./routes/vision-document-intel'));
app.use('/api/pipeline-bottleneck-agent', require('./routes/pipeline-bottleneck-agent'));
app.use('/api/realtime-fraud-stream', require('./routes/realtime-fraud-stream'));
app.use('/api/borrower-engagement', require('./routes/borrower-engagement'));

// === Batch 05 Gaps & Frontend Mounts ===
try { const _gap_asset_verification = require('./routes/gap-asset-verification'); app.use('/api/gap-asset-verification', _gap_asset_verification); } catch(e) { console.error('gap mount fail asset-verification:', e.message); }
try { const _gap_employment_verification = require('./routes/gap-employment-verification'); app.use('/api/gap-employment-verification', _gap_employment_verification); } catch(e) { console.error('gap mount fail employment-verification:', e.message); }
try { const _gap_title_risk_assessment = require('./routes/gap-title-risk-assessment'); app.use('/api/gap-title-risk-assessment', _gap_title_risk_assessment); } catch(e) { console.error('gap mount fail title-risk-assessment:', e.message); }
try { const _gap_closing_readiness = require('./routes/gap-closing-readiness'); app.use('/api/gap-closing-readiness', _gap_closing_readiness); } catch(e) { console.error('gap mount fail closing-readiness:', e.message); }
try { const _gap_e_signature = require('./routes/gap-e-signature'); app.use('/api/gap-e-signature', _gap_e_signature); } catch(e) { console.error('gap mount fail e-signature:', e.message); }
try { const _gap_title = require('./routes/gap-title'); app.use('/api/gap-title', _gap_title); } catch(e) { console.error('gap mount fail title:', e.message); }
try { const _gap_appraisal = require('./routes/gap-appraisal'); app.use('/api/gap-appraisal', _gap_appraisal); } catch(e) { console.error('gap mount fail appraisal:', e.message); }
try { const _gap_third_party = require('./routes/gap-third-party'); app.use('/api/gap-third-party', _gap_third_party); } catch(e) { console.error('gap mount fail third-party:', e.message); }
try { const _gap_borrower = require('./routes/gap-borrower'); app.use('/api/gap-borrower', _gap_borrower); } catch(e) { console.error('gap mount fail borrower:', e.message); }
try { const _gap_pricing = require('./routes/gap-pricing'); app.use('/api/gap-pricing', _gap_pricing); } catch(e) { console.error('gap mount fail pricing:', e.message); }
try { const _gap_webhooks = require('./routes/gap-webhooks'); app.use('/api/gap-webhooks', _gap_webhooks); } catch(e) { console.error('gap mount fail webhooks:', e.message); }
// === End Batch 05 Mounts ===
