-- Drop tables if exist
DROP TABLE IF EXISTS mortgage_operation_records CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS conditions CASCADE;
DROP TABLE IF EXISTS compliance_checks CASCADE;
DROP TABLE IF EXISTS risk_assessments CASCADE;
DROP TABLE IF EXISTS ai_analyses CASCADE;
DROP TABLE IF EXISTS fee_schedules CASCADE;
DROP TABLE IF EXISTS appraisals CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS credit_reports CASCADE;
DROP TABLE IF EXISTS income_records CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS loan_applications CASCADE;
DROP TABLE IF EXISTS borrowers CASCADE;
DROP TABLE IF EXISTS loan_products CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS underwriting_rules CASCADE;
DROP TABLE IF EXISTS pipeline_stages CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'underwriter',
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Borrowers
CREATE TABLE borrowers (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  ssn_last4 VARCHAR(4),
  date_of_birth DATE,
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  employment_status VARCHAR(50),
  employer_name VARCHAR(200),
  job_title VARCHAR(200),
  years_employed DECIMAL(4,1),
  annual_income DECIMAL(12,2),
  monthly_debt DECIMAL(12,2),
  credit_score INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Loan Products
CREATE TABLE loan_products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  interest_rate DECIMAL(5,3),
  min_credit_score INTEGER,
  max_ltv DECIMAL(5,2),
  max_dti DECIMAL(5,2),
  min_down_payment DECIMAL(5,2),
  term_months INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Properties
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  property_type VARCHAR(50),
  year_built INTEGER,
  square_feet INTEGER,
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  lot_size DECIMAL(10,2),
  estimated_value DECIMAL(12,2),
  listing_price DECIMAL(12,2),
  zoning VARCHAR(50),
  flood_zone BOOLEAN DEFAULT false,
  hoa_fee DECIMAL(8,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Loan Applications
CREATE TABLE loan_applications (
  id SERIAL PRIMARY KEY,
  application_number VARCHAR(50) UNIQUE NOT NULL,
  borrower_id INTEGER REFERENCES borrowers(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  loan_product_id INTEGER REFERENCES loan_products(id) ON DELETE SET NULL,
  loan_amount DECIMAL(12,2) NOT NULL,
  down_payment DECIMAL(12,2),
  ltv_ratio DECIMAL(5,2),
  dti_ratio DECIMAL(5,2),
  interest_rate DECIMAL(5,3),
  term_months INTEGER,
  purpose VARCHAR(50),
  status VARCHAR(50) DEFAULT 'submitted',
  priority VARCHAR(20) DEFAULT 'normal',
  assigned_underwriter_id INTEGER REFERENCES users(id),
  submission_date TIMESTAMP DEFAULT NOW(),
  decision_date TIMESTAMP,
  decision VARCHAR(50),
  decision_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES loan_applications(id) ON DELETE CASCADE,
  borrower_id INTEGER REFERENCES borrowers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  file_path VARCHAR(500),
  file_size INTEGER,
  status VARCHAR(50) DEFAULT 'pending_review',
  notes TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Credit Reports
CREATE TABLE credit_reports (
  id SERIAL PRIMARY KEY,
  borrower_id INTEGER REFERENCES borrowers(id) ON DELETE CASCADE,
  bureau VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  report_date DATE NOT NULL,
  total_accounts INTEGER,
  open_accounts INTEGER,
  total_balance DECIMAL(12,2),
  monthly_payments DECIMAL(10,2),
  delinquencies INTEGER DEFAULT 0,
  bankruptcies INTEGER DEFAULT 0,
  collections INTEGER DEFAULT 0,
  inquiries_last_6months INTEGER DEFAULT 0,
  oldest_account_years DECIMAL(4,1),
  status VARCHAR(50) DEFAULT 'current',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Income Records
CREATE TABLE income_records (
  id SERIAL PRIMARY KEY,
  borrower_id INTEGER REFERENCES borrowers(id) ON DELETE CASCADE,
  source VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  start_date DATE,
  end_date DATE,
  verified BOOLEAN DEFAULT false,
  verification_method VARCHAR(100),
  employer_name VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Appraisals
CREATE TABLE appraisals (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  application_id INTEGER REFERENCES loan_applications(id) ON DELETE CASCADE,
  appraiser_name VARCHAR(200),
  appraiser_license VARCHAR(100),
  appraisal_date DATE,
  appraised_value DECIMAL(12,2),
  market_value DECIMAL(12,2),
  condition_rating VARCHAR(50),
  comparable_sales JSONB,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Fee Schedules
CREATE TABLE fee_schedules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_percentage BOOLEAN DEFAULT false,
  applies_to VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conditions / Checklist
CREATE TABLE conditions (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES loan_applications(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'prior_to_closing',
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATE,
  assigned_to INTEGER REFERENCES users(id),
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Compliance Checks
CREATE TABLE compliance_checks (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES loan_applications(id) ON DELETE CASCADE,
  check_type VARCHAR(100) NOT NULL,
  regulation VARCHAR(200),
  status VARCHAR(50) DEFAULT 'pending',
  result VARCHAR(50),
  details TEXT,
  checked_by INTEGER REFERENCES users(id),
  checked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Risk Assessments
CREATE TABLE risk_assessments (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES loan_applications(id) ON DELETE CASCADE,
  risk_category VARCHAR(100) NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  score DECIMAL(5,2),
  factors JSONB,
  recommendation TEXT,
  assessed_by VARCHAR(100),
  assessed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Analyses
CREATE TABLE ai_analyses (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES loan_applications(id) ON DELETE SET NULL,
  borrower_id INTEGER REFERENCES borrowers(id) ON DELETE SET NULL,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  analysis_type VARCHAR(100) NOT NULL,
  input_data JSONB,
  result JSONB,
  confidence DECIMAL(5,2),
  model_used VARCHAR(200),
  processing_time_ms INTEGER,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  link VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Underwriting Rules
CREATE TABLE underwriting_rules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  condition_field VARCHAR(100),
  operator VARCHAR(20),
  threshold_value VARCHAR(100),
  action VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'warning',
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pipeline Stages
CREATE TABLE pipeline_stages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_order INTEGER NOT NULL,
  color VARCHAR(20),
  description TEXT,
  avg_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mortgage Operations Expansion
CREATE TABLE mortgage_operation_records (
  id SERIAL PRIMARY KEY,
  module_key VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'medium',
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  application_id INTEGER REFERENCES loan_applications(id) ON DELETE SET NULL,
  borrower_id INTEGER REFERENCES borrowers(id) ON DELETE SET NULL,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  due_date DATE,
  system_ref VARCHAR(120),
  amount DECIMAL(12,2),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mortgage_operation_records_module ON mortgage_operation_records(module_key);
