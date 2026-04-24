const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = require('./db');
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

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/borrowers', borrowerRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/loan-products', loanProductRoutes);
app.use('/api/credit-reports', creditReportRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/appraisals', appraisalRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/conditions', conditionRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🏦 Mortgage Underwriting Server running on port ${PORT}`);
});
