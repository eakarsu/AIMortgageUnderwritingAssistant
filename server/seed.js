const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mortgage_underwriting',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  const client = await pool.connect();
  try {
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema created successfully');

    // Seed Users (15)
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = [
      ['admin@mortgage.com', hashedPassword, 'Sarah Johnson', 'admin'],
      ['underwriter1@mortgage.com', hashedPassword, 'Michael Chen', 'underwriter'],
      ['underwriter2@mortgage.com', hashedPassword, 'Emily Rodriguez', 'underwriter'],
      ['underwriter3@mortgage.com', hashedPassword, 'David Kim', 'underwriter'],
      ['manager1@mortgage.com', hashedPassword, 'Jennifer Williams', 'manager'],
      ['analyst1@mortgage.com', hashedPassword, 'Robert Brown', 'analyst'],
      ['analyst2@mortgage.com', hashedPassword, 'Lisa Martinez', 'analyst'],
      ['processor1@mortgage.com', hashedPassword, 'James Wilson', 'processor'],
      ['processor2@mortgage.com', hashedPassword, 'Amanda Taylor', 'processor'],
      ['closer1@mortgage.com', hashedPassword, 'Thomas Anderson', 'closer'],
      ['reviewer1@mortgage.com', hashedPassword, 'Patricia Davis', 'reviewer'],
      ['reviewer2@mortgage.com', hashedPassword, 'Christopher Moore', 'reviewer'],
      ['compliance1@mortgage.com', hashedPassword, 'Jessica Thompson', 'compliance'],
      ['supervisor1@mortgage.com', hashedPassword, 'Daniel Garcia', 'supervisor'],
      ['intern1@mortgage.com', hashedPassword, 'Ashley White', 'intern'],
    ];
    for (const u of users) {
      await client.query('INSERT INTO users (email, password, full_name, role) VALUES ($1,$2,$3,$4)', u);
    }
    console.log('Users seeded');

    // Seed Borrowers (20)
    const borrowers = [
      ['John', 'Smith', 'john.smith@email.com', '555-0101', '1234', '1985-03-15', '123 Oak Ave', 'Austin', 'TX', '78701', 'employed', 'Google LLC', 'Software Engineer', 5.5, 145000, 2500, 780],
      ['Maria', 'Garcia', 'maria.garcia@email.com', '555-0102', '5678', '1990-07-22', '456 Pine St', 'Denver', 'CO', '80201', 'employed', 'Amazon', 'Product Manager', 3.0, 135000, 1800, 745],
      ['Robert', 'Johnson', 'robert.j@email.com', '555-0103', '9012', '1978-11-08', '789 Elm Dr', 'Seattle', 'WA', '98101', 'self_employed', 'RJ Consulting', 'Consultant', 8.0, 175000, 3200, 720],
      ['Jennifer', 'Williams', 'jen.w@email.com', '555-0104', '3456', '1992-01-30', '321 Maple Ln', 'Portland', 'OR', '97201', 'employed', 'Nike Inc', 'Marketing Director', 4.5, 125000, 2100, 760],
      ['David', 'Brown', 'david.b@email.com', '555-0105', '7890', '1988-06-12', '654 Cedar Ct', 'San Francisco', 'CA', '94101', 'employed', 'Meta', 'Data Scientist', 2.5, 190000, 4500, 800],
      ['Sarah', 'Davis', 'sarah.d@email.com', '555-0106', '2345', '1995-09-25', '987 Birch Way', 'Chicago', 'IL', '60601', 'employed', 'JP Morgan', 'Financial Analyst', 1.5, 95000, 1500, 710],
      ['Michael', 'Martinez', 'mike.m@email.com', '555-0107', '6789', '1982-04-18', '147 Walnut Rd', 'Miami', 'FL', '33101', 'employed', 'Baptist Health', 'Physician', 12.0, 285000, 5800, 790],
      ['Lisa', 'Anderson', 'lisa.a@email.com', '555-0108', '0123', '1987-12-03', '258 Spruce Pl', 'Boston', 'MA', '02101', 'employed', 'Harvard University', 'Professor', 7.0, 115000, 1900, 755],
      ['James', 'Thomas', 'james.t@email.com', '555-0109', '4567', '1993-08-17', '369 Aspen Blvd', 'Nashville', 'TN', '37201', 'employed', 'Bridgestone', 'Engineer', 3.5, 105000, 2000, 730],
      ['Emily', 'Jackson', 'emily.j@email.com', '555-0110', '8901', '1991-02-28', '471 Redwood Ave', 'Atlanta', 'GA', '30301', 'employed', 'Delta Airlines', 'Pilot', 6.0, 165000, 3100, 775],
      ['Christopher', 'White', 'chris.w@email.com', '555-0111', '2346', '1980-10-05', '582 Poplar St', 'Phoenix', 'AZ', '85001', 'self_employed', 'White Design Studio', 'Architect', 10.0, 155000, 2800, 740],
      ['Amanda', 'Harris', 'amanda.h@email.com', '555-0112', '6780', '1994-05-20', '693 Hickory Dr', 'Dallas', 'TX', '75201', 'employed', 'Texas Instruments', 'Electrical Engineer', 2.0, 110000, 1700, 765],
      ['Daniel', 'Clark', 'daniel.c@email.com', '555-0113', '0124', '1986-09-11', '804 Chestnut Ln', 'San Diego', 'CA', '92101', 'employed', 'Qualcomm', 'RF Engineer', 5.0, 140000, 2400, 750],
      ['Nicole', 'Lewis', 'nicole.l@email.com', '555-0114', '4568', '1989-03-07', '915 Sycamore Ct', 'Minneapolis', 'MN', '55401', 'employed', 'Target Corp', 'Supply Chain Manager', 4.0, 120000, 2200, 725],
      ['Matthew', 'Lee', 'matt.l@email.com', '555-0115', '8902', '1983-07-29', '126 Magnolia Way', 'Raleigh', 'NC', '27601', 'employed', 'Cisco', 'Network Engineer', 6.5, 130000, 2600, 770],
      ['Rachel', 'Walker', 'rachel.w@email.com', '555-0116', '2347', '1996-11-14', '237 Willow Rd', 'Charlotte', 'NC', '28201', 'employed', 'Bank of America', 'VP Operations', 3.0, 160000, 3500, 795],
      ['Kevin', 'Hall', 'kevin.h@email.com', '555-0117', '6781', '1981-01-22', '348 Oak Park Dr', 'Tampa', 'FL', '33601', 'retired', 'US Army', 'Colonel (Ret)', 25.0, 85000, 800, 810],
      ['Stephanie', 'Allen', 'steph.a@email.com', '555-0118', '0125', '1990-08-09', '459 Cherry Ln', 'Salt Lake City', 'UT', '84101', 'employed', 'Goldman Sachs', 'Trader', 5.0, 225000, 4000, 785],
      ['Andrew', 'Young', 'andrew.y@email.com', '555-0119', '4569', '1977-04-01', '570 Peach St', 'Columbus', 'OH', '43201', 'self_employed', 'Young Law Firm', 'Attorney', 15.0, 210000, 3800, 760],
      ['Megan', 'King', 'megan.k@email.com', '555-0120', '8903', '1998-12-18', '681 Laurel Blvd', 'Washington', 'DC', '20001', 'employed', 'Deloitte', 'Consultant', 1.0, 92000, 1200, 700],
    ];
    for (const b of borrowers) {
      await client.query(
        `INSERT INTO borrowers (first_name,last_name,email,phone,ssn_last4,date_of_birth,address,city,state,zip,employment_status,employer_name,job_title,years_employed,annual_income,monthly_debt,credit_score) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        b
      );
    }
    console.log('Borrowers seeded');

    // Seed Loan Products (16)
    const loanProducts = [
      ['30-Year Fixed Conventional', 'conventional', 6.875, 620, 97.00, 50.00, 3.00, 360, 'Standard 30-year fixed rate conventional mortgage'],
      ['15-Year Fixed Conventional', 'conventional', 6.125, 680, 90.00, 43.00, 10.00, 180, 'Shorter term with lower rate conventional mortgage'],
      ['FHA 30-Year Fixed', 'fha', 6.500, 580, 96.50, 57.00, 3.50, 360, 'Government-backed FHA loan with lower requirements'],
      ['VA 30-Year Fixed', 'va', 6.250, 580, 100.00, 60.00, 0.00, 360, 'Veterans Affairs guaranteed home loan'],
      ['USDA Rural Development', 'usda', 6.375, 640, 100.00, 46.00, 0.00, 360, 'Rural area zero down payment loan'],
      ['5/1 ARM Conventional', 'arm', 5.750, 680, 90.00, 45.00, 10.00, 360, 'Adjustable rate - fixed for 5 years then annual adjustment'],
      ['7/1 ARM Conventional', 'arm', 6.000, 680, 90.00, 45.00, 10.00, 360, 'Adjustable rate - fixed for 7 years then annual adjustment'],
      ['Jumbo 30-Year Fixed', 'jumbo', 7.250, 720, 80.00, 43.00, 20.00, 360, 'For loan amounts exceeding conforming limits'],
      ['Jumbo 15-Year Fixed', 'jumbo', 6.750, 740, 75.00, 40.00, 25.00, 180, 'Shorter term jumbo with lower rate'],
      ['FHA 203(k) Renovation', 'fha', 7.000, 580, 96.50, 57.00, 3.50, 360, 'FHA renovation loan for fixer-upper properties'],
      ['Construction-to-Permanent', 'construction', 7.500, 700, 80.00, 43.00, 20.00, 360, 'Single-close construction and permanent financing'],
      ['Home Equity Line of Credit', 'heloc', 8.250, 680, 85.00, 50.00, 15.00, 120, 'Revolving credit line secured by home equity'],
      ['Investment Property 30-Year', 'investment', 7.625, 720, 75.00, 45.00, 25.00, 360, 'For non-owner-occupied investment properties'],
      ['Second Home 30-Year', 'second_home', 7.125, 680, 85.00, 45.00, 15.00, 360, 'For vacation or second home purchases'],
      ['Interest-Only ARM', 'arm', 6.500, 740, 80.00, 40.00, 20.00, 360, 'Interest-only payments for initial period'],
      ['Community Reinvestment', 'community', 5.875, 580, 100.00, 55.00, 0.00, 360, 'Special program for underserved communities'],
    ];
    for (const lp of loanProducts) {
      await client.query(
        `INSERT INTO loan_products (name,type,interest_rate,min_credit_score,max_ltv,max_dti,min_down_payment,term_months,description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        lp
      );
    }
    console.log('Loan products seeded');

    // Seed Properties (20)
    const properties = [
      ['123 Sunset Blvd', 'Los Angeles', 'CA', '90001', 'single_family', 1998, 2200, 4, 2.5, 0.25, 850000, 875000, 'residential', false, 0],
      ['456 Lake Shore Dr', 'Chicago', 'IL', '60601', 'condo', 2015, 1400, 2, 2.0, 0, 425000, 449000, 'residential', false, 450],
      ['789 Mountain View Rd', 'Denver', 'CO', '80201', 'single_family', 2005, 2800, 5, 3.0, 0.35, 725000, 749000, 'residential', false, 0],
      ['321 River Walk', 'San Antonio', 'TX', '78201', 'townhouse', 2018, 1800, 3, 2.5, 0.12, 385000, 399000, 'residential', false, 200],
      ['654 Park Ave', 'New York', 'NY', '10001', 'condo', 2020, 1100, 2, 1.0, 0, 1250000, 1295000, 'residential', false, 1200],
      ['987 Peachtree St', 'Atlanta', 'GA', '30301', 'single_family', 1995, 3200, 5, 3.5, 0.50, 550000, 575000, 'residential', false, 0],
      ['147 Bayfront Dr', 'Miami', 'FL', '33101', 'condo', 2022, 1600, 3, 2.0, 0, 680000, 699000, 'residential', true, 650],
      ['258 Capitol Hill', 'Washington', 'DC', '20001', 'townhouse', 1920, 2400, 4, 3.0, 0.08, 975000, 999000, 'residential', false, 0],
      ['369 Tech Way', 'San Jose', 'CA', '95101', 'single_family', 2010, 1900, 3, 2.0, 0.20, 1100000, 1150000, 'residential', false, 0],
      ['471 Harbor Ln', 'Seattle', 'WA', '98101', 'single_family', 2008, 2600, 4, 2.5, 0.30, 895000, 925000, 'residential', false, 0],
      ['582 Desert Rose Ave', 'Phoenix', 'AZ', '85001', 'single_family', 2015, 2100, 4, 2.0, 0.18, 445000, 465000, 'residential', false, 0],
      ['693 Music Row', 'Nashville', 'TN', '37201', 'townhouse', 2019, 1700, 3, 2.5, 0.10, 520000, 545000, 'residential', false, 175],
      ['804 Beacon St', 'Boston', 'MA', '02101', 'condo', 1880, 1200, 2, 1.5, 0, 625000, 649000, 'residential', false, 500],
      ['915 Alamo Sq', 'San Francisco', 'CA', '94101', 'multi_family', 1925, 4200, 6, 4.0, 0.15, 1800000, 1850000, 'mixed', false, 0],
      ['126 Ranch Rd', 'Austin', 'TX', '78701', 'single_family', 2021, 2500, 4, 3.0, 0.40, 650000, 675000, 'residential', false, 0],
      ['237 Palm Dr', 'Orlando', 'FL', '32801', 'single_family', 2012, 2300, 4, 2.5, 0.22, 475000, 495000, 'residential', false, 85],
      ['348 Vineyard Ln', 'Napa', 'CA', '94558', 'single_family', 2000, 3500, 5, 4.0, 1.50, 1450000, 1500000, 'residential', false, 0],
      ['459 Prairie View', 'Minneapolis', 'MN', '55401', 'single_family', 1985, 2000, 3, 2.0, 0.25, 380000, 399000, 'residential', false, 0],
      ['570 Coastal Hwy', 'Virginia Beach', 'VA', '23451', 'condo', 2017, 1300, 2, 2.0, 0, 345000, 359000, 'residential', true, 350],
      ['681 Summit Peak', 'Salt Lake City', 'UT', '84101', 'single_family', 2016, 2700, 4, 3.0, 0.30, 585000, 599000, 'residential', false, 0],
    ];
    for (const p of properties) {
      await client.query(
        `INSERT INTO properties (address,city,state,zip,property_type,year_built,square_feet,bedrooms,bathrooms,lot_size,estimated_value,listing_price,zoning,flood_zone,hoa_fee) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        p
      );
    }
    console.log('Properties seeded');

    // Seed Loan Applications (20)
    const applications = [
      ['APP-2024-001', 1, 1, 1, 680000, 170000, 80.00, 35.50, 6.875, 360, 'purchase', 'in_review', 'high', 2],
      ['APP-2024-002', 2, 3, 3, 560000, 19600, 96.50, 28.00, 6.500, 360, 'purchase', 'submitted', 'normal', 3],
      ['APP-2024-003', 3, 6, 1, 450000, 45000, 90.00, 42.00, 6.875, 360, 'purchase', 'approved', 'normal', 2],
      ['APP-2024-004', 4, 4, 2, 299000, 29900, 90.00, 32.00, 6.125, 180, 'purchase', 'in_review', 'normal', 4],
      ['APP-2024-005', 5, 9, 8, 920000, 230000, 80.00, 38.00, 7.250, 360, 'purchase', 'submitted', 'high', 2],
      ['APP-2024-006', 6, 2, 1, 340000, 10200, 97.00, 45.00, 6.875, 360, 'purchase', 'conditional', 'urgent', 3],
      ['APP-2024-007', 7, 7, 8, 550000, 138000, 75.00, 28.00, 7.250, 360, 'purchase', 'approved', 'normal', 2],
      ['APP-2024-008', 8, 13, 1, 480000, 48000, 90.00, 36.00, 6.875, 360, 'refinance', 'in_review', 'normal', 4],
      ['APP-2024-009', 9, 12, 1, 395000, 39500, 90.00, 41.00, 6.875, 360, 'purchase', 'submitted', 'normal', 3],
      ['APP-2024-010', 10, 10, 4, 725000, 108750, 85.00, 33.00, 6.250, 360, 'purchase', 'approved', 'high', 2],
      ['APP-2024-011', 11, 11, 1, 365000, 36500, 90.00, 39.00, 6.875, 360, 'purchase', 'denied', 'normal', 4],
      ['APP-2024-012', 12, 15, 3, 510000, 17850, 96.50, 30.00, 6.500, 360, 'purchase', 'in_review', 'normal', 3],
      ['APP-2024-013', 13, 16, 1, 380000, 38000, 90.00, 37.00, 6.875, 360, 'purchase', 'submitted', 'normal', 2],
      ['APP-2024-014', 14, 18, 1, 300000, 30000, 90.00, 40.00, 6.875, 360, 'refinance', 'conditional', 'normal', 4],
      ['APP-2024-015', 15, 20, 1, 460000, 46000, 90.00, 34.00, 6.875, 360, 'purchase', 'in_review', 'high', 2],
      ['APP-2024-016', 16, 5, 8, 1050000, 262500, 75.00, 36.00, 7.250, 360, 'purchase', 'submitted', 'urgent', 3],
      ['APP-2024-017', 17, 19, 4, 270000, 0, 100.00, 22.00, 6.250, 360, 'purchase', 'approved', 'normal', 2],
      ['APP-2024-018', 18, 14, 8, 1200000, 360000, 70.00, 30.00, 7.250, 360, 'purchase', 'in_review', 'high', 4],
      ['APP-2024-019', 19, 8, 1, 780000, 78000, 90.00, 35.00, 6.875, 360, 'refinance', 'submitted', 'normal', 3],
      ['APP-2024-020', 20, 17, 16, 320000, 0, 100.00, 48.00, 5.875, 360, 'purchase', 'conditional', 'normal', 2],
    ];
    for (const a of applications) {
      await client.query(
        `INSERT INTO loan_applications (application_number,borrower_id,property_id,loan_product_id,loan_amount,down_payment,ltv_ratio,dti_ratio,interest_rate,term_months,purpose,status,priority,assigned_underwriter_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        a
      );
    }
    console.log('Loan applications seeded');

    // Seed Documents (18)
    const documents = [
      [1, 1, 'W2_2023_John_Smith.pdf', 'w2', '/docs/w2_2023_js.pdf', 245000, 'approved', 'Verified with IRS'],
      [1, 1, 'Pay_Stubs_Q4_2023.pdf', 'pay_stub', '/docs/paystubs_js.pdf', 180000, 'approved', 'Consistent income'],
      [1, 1, 'Bank_Statements_6mo.pdf', 'bank_statement', '/docs/bank_js.pdf', 520000, 'approved', null],
      [2, 2, 'Tax_Returns_2023.pdf', 'tax_return', '/docs/tax_mg.pdf', 890000, 'pending_review', null],
      [2, 2, 'Employment_Verification.pdf', 'employment_letter', '/docs/emp_mg.pdf', 125000, 'approved', null],
      [3, 3, 'Business_License.pdf', 'business_license', '/docs/biz_rj.pdf', 98000, 'approved', 'Self-employed verification'],
      [3, 3, 'Profit_Loss_2023.pdf', 'profit_loss', '/docs/pl_rj.pdf', 445000, 'approved', null],
      [4, 4, 'W2_2023_Jennifer.pdf', 'w2', '/docs/w2_jw.pdf', 210000, 'pending_review', null],
      [5, 5, 'Stock_Portfolio.pdf', 'asset_statement', '/docs/stock_db.pdf', 670000, 'approved', 'Liquid assets confirmed'],
      [6, 6, 'Credit_Explanation_Letter.pdf', 'credit_letter', '/docs/credit_sd.pdf', 45000, 'pending_review', 'Needs review - late payments explained'],
      [7, 7, 'Medical_License.pdf', 'professional_license', '/docs/med_mm.pdf', 78000, 'approved', null],
      [8, 8, 'Tenure_Letter.pdf', 'employment_letter', '/docs/tenure_la.pdf', 92000, 'approved', null],
      [10, 10, 'FAA_Certificate.pdf', 'professional_license', '/docs/faa_ej.pdf', 156000, 'approved', null],
      [10, 10, 'Union_Income_Verification.pdf', 'income_verification', '/docs/union_ej.pdf', 134000, 'approved', null],
      [12, 12, 'W2_2023_Amanda.pdf', 'w2', '/docs/w2_ah.pdf', 198000, 'pending_review', null],
      [15, 15, 'Employment_Contract.pdf', 'employment_letter', '/docs/emp_ml.pdf', 167000, 'approved', null],
      [18, 18, 'Trading_Statement.pdf', 'asset_statement', '/docs/trade_sa.pdf', 890000, 'approved', 'High net worth verified'],
      [19, 19, 'Bar_License.pdf', 'professional_license', '/docs/bar_ay.pdf', 67000, 'approved', null],
    ];
    for (const d of documents) {
      await client.query(
        `INSERT INTO documents (application_id,borrower_id,name,type,file_path,file_size,status,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        d
      );
    }
    console.log('Documents seeded');

    // Seed Credit Reports (20)
    const creditReports = [
      [1, 'Experian', 780, '2024-01-15', 12, 8, 45000, 2500, 0, 0, 0, 1, 15.5],
      [1, 'TransUnion', 775, '2024-01-15', 12, 8, 44500, 2500, 0, 0, 0, 1, 15.5],
      [1, 'Equifax', 785, '2024-01-15', 11, 7, 43000, 2400, 0, 0, 0, 2, 15.0],
      [2, 'Experian', 745, '2024-01-20', 8, 6, 32000, 1800, 0, 0, 0, 2, 8.0],
      [2, 'TransUnion', 740, '2024-01-20', 9, 6, 33000, 1850, 0, 0, 0, 2, 7.5],
      [3, 'Experian', 720, '2024-02-01', 15, 10, 78000, 3200, 1, 0, 0, 3, 20.0],
      [4, 'Experian', 760, '2024-02-05', 7, 5, 28000, 2100, 0, 0, 0, 1, 6.0],
      [5, 'Experian', 800, '2024-02-10', 18, 12, 125000, 4500, 0, 0, 0, 0, 18.0],
      [6, 'Experian', 710, '2024-02-12', 10, 7, 52000, 1500, 2, 0, 1, 4, 5.0],
      [6, 'TransUnion', 705, '2024-02-12', 10, 7, 51000, 1550, 2, 0, 1, 3, 5.0],
      [7, 'Experian', 790, '2024-02-15', 14, 9, 95000, 5800, 0, 0, 0, 1, 22.0],
      [8, 'Experian', 755, '2024-02-18', 9, 6, 38000, 1900, 0, 0, 0, 2, 12.0],
      [9, 'Experian', 730, '2024-02-20', 6, 4, 22000, 2000, 0, 0, 0, 1, 4.5],
      [10, 'Experian', 775, '2024-02-22', 11, 8, 65000, 3100, 0, 0, 0, 1, 14.0],
      [11, 'Experian', 740, '2024-02-25', 13, 9, 55000, 2800, 1, 0, 0, 2, 10.0],
      [12, 'Experian', 765, '2024-02-28', 5, 4, 18000, 1700, 0, 0, 0, 0, 3.0],
      [14, 'Experian', 725, '2024-03-01', 10, 7, 48000, 2200, 0, 0, 0, 3, 9.0],
      [16, 'Experian', 795, '2024-03-05', 16, 11, 110000, 3500, 0, 0, 0, 1, 16.0],
      [18, 'Experian', 785, '2024-03-08', 20, 14, 180000, 4000, 0, 0, 0, 0, 12.0],
      [20, 'Experian', 700, '2024-03-10', 4, 3, 15000, 1200, 0, 0, 0, 2, 2.0],
    ];
    for (const cr of creditReports) {
      await client.query(
        `INSERT INTO credit_reports (borrower_id,bureau,score,report_date,total_accounts,open_accounts,total_balance,monthly_payments,delinquencies,bankruptcies,collections,inquiries_last_6months,oldest_account_years) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        cr
      );
    }
    console.log('Credit reports seeded');

    // Seed Income Records (18)
    const incomeRecords = [
      [1, 'Google LLC', 'salary', 145000, 'annual', '2019-06-01', null, true, 'W2 + employer verification', 'Google LLC'],
      [1, 'Side Consulting', 'freelance', 15000, 'annual', '2022-01-01', null, true, 'Tax returns', null],
      [2, 'Amazon', 'salary', 135000, 'annual', '2021-09-01', null, true, 'Employment letter', 'Amazon'],
      [3, 'RJ Consulting', 'self_employment', 175000, 'annual', '2016-03-01', null, true, 'P&L + tax returns', 'RJ Consulting'],
      [4, 'Nike Inc', 'salary', 125000, 'annual', '2020-04-01', null, true, 'W2', 'Nike Inc'],
      [5, 'Meta', 'salary', 190000, 'annual', '2022-06-01', null, true, 'W2 + stock grants', 'Meta'],
      [5, 'Stock Dividends', 'investment', 25000, 'annual', '2020-01-01', null, true, 'Brokerage statements', null],
      [6, 'JP Morgan', 'salary', 95000, 'annual', '2023-03-01', null, true, 'W2', 'JP Morgan'],
      [7, 'Baptist Health', 'salary', 285000, 'annual', '2012-08-01', null, true, 'W2 + contract', 'Baptist Health'],
      [8, 'Harvard University', 'salary', 115000, 'annual', '2017-09-01', null, true, 'Tenure letter', 'Harvard University'],
      [9, 'Bridgestone', 'salary', 105000, 'annual', '2021-02-01', null, true, 'W2', 'Bridgestone'],
      [10, 'Delta Airlines', 'salary', 165000, 'annual', '2018-07-01', null, true, 'Union verification', 'Delta Airlines'],
      [11, 'White Design Studio', 'self_employment', 155000, 'annual', '2014-01-01', null, true, 'P&L + tax returns', 'White Design Studio'],
      [12, 'Texas Instruments', 'salary', 110000, 'annual', '2022-10-01', null, false, 'Pending W2', 'Texas Instruments'],
      [14, 'Target Corp', 'salary', 120000, 'annual', '2020-05-01', null, true, 'W2 + pay stubs', 'Target Corp'],
      [16, 'Bank of America', 'salary', 160000, 'annual', '2021-08-01', null, true, 'W2', 'Bank of America'],
      [17, 'US Army Retirement', 'pension', 85000, 'annual', '1999-06-01', null, true, 'DD-214 + retirement letter', 'US Army'],
      [18, 'Goldman Sachs', 'salary', 225000, 'annual', '2019-07-01', null, true, 'W2 + bonus schedule', 'Goldman Sachs'],
    ];
    for (const ir of incomeRecords) {
      await client.query(
        `INSERT INTO income_records (borrower_id,source,type,amount,frequency,start_date,end_date,verified,verification_method,employer_name) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        ir
      );
    }
    console.log('Income records seeded');

    // Seed Appraisals (16)
    const appraisals = [
      [1, 1, 'John Appraiser', 'CA-12345', '2024-01-20', 860000, 850000, 'good', '{"sales":[{"address":"125 Sunset","price":845000},{"address":"130 Sunset","price":870000}]}', 'Property in good condition', 'completed'],
      [3, 2, 'Mike Valuator', 'CO-23456', '2024-02-01', 730000, 725000, 'excellent', '{"sales":[{"address":"791 Mountain","price":715000},{"address":"785 Mountain","price":740000}]}', null, 'completed'],
      [6, 3, 'Sarah Appraise', 'GA-34567', '2024-02-10', 555000, 550000, 'good', '{"sales":[{"address":"985 Peachtree","price":540000}]}', null, 'completed'],
      [4, 4, 'Tom Inspector', 'TX-45678', '2024-02-08', 390000, 385000, 'very_good', '{"sales":[{"address":"325 River","price":380000}]}', null, 'completed'],
      [9, 5, 'Lisa Value', 'CA-56789', '2024-02-12', 1110000, 1100000, 'good', '{"sales":[{"address":"370 Tech","price":1090000}]}', null, 'completed'],
      [7, 7, 'Alex Assess', 'FL-67890', '2024-02-15', 685000, 680000, 'good', '{"sales":[{"address":"149 Bayfront","price":675000}]}', 'Flood zone - needs insurance', 'completed'],
      [10, 10, 'Rachel Rate', 'WA-78901', '2024-02-20', 900000, 895000, 'excellent', '{"sales":[{"address":"473 Harbor","price":890000}]}', null, 'completed'],
      [12, 12, 'Chris Comp', 'TN-89012', '2024-02-25', 525000, 520000, 'good', '{"sales":[{"address":"695 Music","price":515000}]}', null, 'completed'],
      [15, 15, 'David Judge', 'TX-90123', '2024-03-01', 655000, 650000, 'very_good', '{"sales":[{"address":"128 Ranch","price":645000}]}', null, 'completed'],
      [2, 2, 'Emma Price', 'IL-01234', '2024-01-25', 430000, 425000, 'good', '{"sales":[{"address":"458 Lake","price":420000}]}', null, 'completed'],
      [5, 5, 'Frank Marker', 'NY-12345', '2024-02-14', 1260000, 1250000, 'excellent', '{"sales":[{"address":"656 Park","price":1240000}]}', null, 'completed'],
      [11, 11, 'Grace Holmes', 'AZ-23456', '2024-02-22', 450000, 445000, 'good', '{"sales":[{"address":"584 Desert","price":440000}]}', null, 'completed'],
      [14, 14, 'Henry Worth', 'MN-34567', '2024-02-28', 385000, 380000, 'fair', '{"sales":[{"address":"461 Prairie","price":375000}]}', 'Needs minor repairs', 'completed'],
      [16, 16, 'Ivy Estimate', 'FL-45678', '2024-03-02', 480000, 475000, 'good', '{"sales":[{"address":"239 Palm","price":470000}]}', null, 'pending'],
      [20, 20, 'Jack Measure', 'UT-56789', '2024-03-05', 590000, 585000, 'very_good', '{"sales":[{"address":"683 Summit","price":580000}]}', null, 'pending'],
      [17, 17, 'Karen Eval', 'VA-67890', '2024-03-03', 350000, 345000, 'good', '{"sales":[{"address":"572 Coastal","price":340000}]}', null, 'pending'],
    ];
    for (const a of appraisals) {
      await client.query(
        `INSERT INTO appraisals (property_id,application_id,appraiser_name,appraiser_license,appraisal_date,appraised_value,market_value,condition_rating,comparable_sales,notes,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)`,
        a
      );
    }
    console.log('Appraisals seeded');

    // Seed Fee Schedules (16)
    const feeSchedules = [
      ['Loan Origination Fee', 'origination', 1.00, true, 'loan_amount', 'Percentage of loan amount charged at closing'],
      ['Application Fee', 'application', 500.00, false, 'all_loans', 'Non-refundable application processing fee'],
      ['Appraisal Fee', 'third_party', 650.00, false, 'all_loans', 'Property appraisal cost'],
      ['Credit Report Fee', 'third_party', 75.00, false, 'all_loans', 'Tri-merge credit report pull'],
      ['Title Search Fee', 'title', 450.00, false, 'all_loans', 'Title search and examination'],
      ['Title Insurance', 'title', 0.50, true, 'loan_amount', 'Lender title insurance premium'],
      ['Recording Fee', 'government', 125.00, false, 'all_loans', 'County recording of mortgage documents'],
      ['Flood Certification', 'third_party', 25.00, false, 'all_loans', 'FEMA flood zone determination'],
      ['Survey Fee', 'third_party', 500.00, false, 'single_family', 'Property boundary survey'],
      ['Attorney Fee', 'legal', 750.00, false, 'all_loans', 'Closing attorney services'],
      ['Document Preparation', 'processing', 350.00, false, 'all_loans', 'Loan document preparation and review'],
      ['Underwriting Fee', 'processing', 800.00, false, 'all_loans', 'Loan underwriting analysis fee'],
      ['Wire Transfer Fee', 'processing', 50.00, false, 'all_loans', 'Funds disbursement wire transfer'],
      ['PMI Monthly Premium', 'insurance', 0.085, true, 'loan_amount', 'Private mortgage insurance for LTV > 80%'],
      ['FHA Upfront MIP', 'insurance', 1.75, true, 'loan_amount', 'FHA mortgage insurance premium upfront'],
      ['VA Funding Fee', 'government', 2.15, true, 'loan_amount', 'VA loan funding fee for first-time use'],
    ];
    for (const f of feeSchedules) {
      await client.query(
        `INSERT INTO fee_schedules (name,category,amount,is_percentage,applies_to,description) VALUES ($1,$2,$3,$4,$5,$6)`,
        f
      );
    }
    console.log('Fee schedules seeded');

    // Seed Conditions (18)
    const conditions = [
      [1, 'Income', 'Provide most recent 30 days of pay stubs', 'prior_to_closing', 'high', 'completed', '2024-02-15'],
      [1, 'Assets', 'Provide 2 months bank statements for all accounts', 'prior_to_closing', 'high', 'completed', '2024-02-15'],
      [1, 'Property', 'Obtain satisfactory property appraisal', 'prior_to_closing', 'high', 'completed', '2024-02-20'],
      [2, 'Income', 'Provide 2 years of tax returns', 'prior_to_approval', 'high', 'pending', '2024-03-01'],
      [2, 'Employment', 'Verbal verification of employment within 10 days of closing', 'prior_to_closing', 'medium', 'pending', '2024-03-15'],
      [3, 'Income', 'Provide YTD profit and loss statement', 'prior_to_approval', 'high', 'completed', '2024-02-10'],
      [3, 'Insurance', 'Provide proof of homeowners insurance', 'prior_to_closing', 'medium', 'completed', '2024-02-25'],
      [4, 'Title', 'Clear title search with no liens', 'prior_to_closing', 'high', 'pending', '2024-03-10'],
      [5, 'Assets', 'Provide documentation for large deposits over $5,000', 'prior_to_approval', 'high', 'pending', '2024-03-05'],
      [6, 'Credit', 'Provide written explanation for late payments in 2022', 'prior_to_approval', 'high', 'in_progress', '2024-02-28'],
      [6, 'Income', 'Provide current pay stub showing YTD earnings', 'prior_to_approval', 'medium', 'pending', '2024-03-01'],
      [8, 'Employment', 'Provide tenure verification letter from university', 'prior_to_approval', 'medium', 'completed', '2024-02-20'],
      [10, 'Insurance', 'Provide flood insurance quote (property in flood zone)', 'prior_to_closing', 'high', 'pending', '2024-03-15'],
      [12, 'Income', 'Provide W2 for current tax year', 'prior_to_approval', 'high', 'pending', '2024-03-10'],
      [15, 'Property', 'Obtain termite inspection report', 'prior_to_closing', 'medium', 'pending', '2024-03-20'],
      [18, 'Assets', 'Document source of down payment funds', 'prior_to_approval', 'high', 'in_progress', '2024-03-08'],
      [19, 'Income', 'Provide 2 years of business tax returns', 'prior_to_approval', 'high', 'pending', '2024-03-12'],
      [20, 'Eligibility', 'Verify USDA property eligibility', 'prior_to_approval', 'high', 'pending', '2024-03-15'],
    ];
    for (const c of conditions) {
      await client.query(
        `INSERT INTO conditions (application_id,category,description,type,priority,status,due_date) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        c
      );
    }
    console.log('Conditions seeded');

    // Seed Compliance Checks (16)
    const complianceChecks = [
      [1, 'TRID Disclosure', 'TILA-RESPA Integrated Disclosure', 'passed', 'pass', 'Loan estimate provided within 3 business days'],
      [1, 'HMDA Reporting', 'Home Mortgage Disclosure Act', 'passed', 'pass', 'All required data fields collected'],
      [1, 'Fair Lending', 'Equal Credit Opportunity Act', 'passed', 'pass', 'No discriminatory factors identified'],
      [2, 'TRID Disclosure', 'TILA-RESPA Integrated Disclosure', 'passed', 'pass', null],
      [3, 'TRID Disclosure', 'TILA-RESPA Integrated Disclosure', 'passed', 'pass', null],
      [3, 'QM/ATR', 'Qualified Mortgage / Ability to Repay', 'passed', 'pass', 'DTI within QM safe harbor limits'],
      [4, 'TRID Disclosure', 'TILA-RESPA Integrated Disclosure', 'pending', null, null],
      [5, 'Anti-Money Laundering', 'Bank Secrecy Act / AML', 'passed', 'pass', 'No suspicious activity detected'],
      [6, 'TRID Disclosure', 'TILA-RESPA Integrated Disclosure', 'passed', 'pass', null],
      [6, 'QM/ATR', 'Qualified Mortgage / Ability to Repay', 'failed', 'fail', 'DTI exceeds QM safe harbor - needs manual review'],
      [7, 'OFAC Screening', 'Office of Foreign Assets Control', 'passed', 'pass', 'No matches on SDN list'],
      [10, 'VA Eligibility', 'VA Loan Guaranty', 'passed', 'pass', 'COE verified - eligible veteran'],
      [12, 'FHA Guidelines', 'FHA Minimum Property Standards', 'pending', null, 'Awaiting property inspection'],
      [15, 'Flood Insurance', 'National Flood Insurance Program', 'pending', null, 'Property near flood zone boundary'],
      [18, 'Jumbo Guidelines', 'Non-Agency Jumbo Requirements', 'passed', 'pass', 'Meets all jumbo overlay requirements'],
      [20, 'USDA Eligibility', 'USDA Rural Development', 'pending', null, 'Verifying property location eligibility'],
    ];
    for (const cc of complianceChecks) {
      await client.query(
        `INSERT INTO compliance_checks (application_id,check_type,regulation,status,result,details) VALUES ($1,$2,$3,$4,$5,$6)`,
        cc
      );
    }
    console.log('Compliance checks seeded');

    // Seed Risk Assessments (16)
    const riskAssessments = [
      [1, 'Credit Risk', 'low', 92.5, '{"credit_score":780,"payment_history":"excellent","debt_ratio":"manageable"}', 'Strong credit profile with excellent payment history', 'AI System'],
      [1, 'Collateral Risk', 'low', 88.0, '{"ltv":80,"appraisal_vs_price":"aligned","market_trend":"stable"}', 'Property value well-supported by comparables', 'AI System'],
      [2, 'Credit Risk', 'low', 85.0, '{"credit_score":745,"payment_history":"good","debt_ratio":"low"}', 'Good credit with moderate history', 'AI System'],
      [3, 'Income Risk', 'medium', 72.0, '{"employment_type":"self_employed","income_stability":"variable","years":8}', 'Self-employment requires careful income averaging', 'AI System'],
      [5, 'Market Risk', 'medium', 68.5, '{"property_type":"condo","market":"NYC","price_trend":"declining"}', 'High-value NYC condo in softening market', 'AI System'],
      [6, 'Credit Risk', 'high', 45.0, '{"credit_score":710,"delinquencies":2,"collections":1,"dti":45}', 'Elevated risk due to past delinquencies and high DTI', 'AI System'],
      [6, 'Capacity Risk', 'high', 42.0, '{"dti":45,"income_trend":"flat","reserves":"minimal"}', 'DTI at upper limit with minimal reserves', 'AI System'],
      [7, 'Credit Risk', 'low', 95.0, '{"credit_score":790,"physician_loan":true}', 'Physician borrower with excellent credit', 'AI System'],
      [10, 'Credit Risk', 'low', 90.0, '{"credit_score":775,"va_loan":true}', 'VA eligible with strong credit profile', 'AI System'],
      [11, 'Collateral Risk', 'medium', 65.0, '{"ltv":90,"market":"Phoenix","volatility":"moderate"}', 'High LTV in moderately volatile market', 'AI System'],
      [12, 'Income Risk', 'low', 82.0, '{"employment_type":"W2","years":2,"company":"stable"}', 'Short tenure but stable employer', 'AI System'],
      [15, 'Overall Risk', 'low', 86.0, '{"composite_score":"strong","no_flags":true}', 'Well-qualified borrower across all dimensions', 'AI System'],
      [16, 'Fraud Risk', 'low', 94.0, '{"identity_verified":true,"income_consistent":true}', 'No fraud indicators detected', 'AI System'],
      [18, 'Concentration Risk', 'medium', 70.0, '{"jumbo_amount":true,"single_income":true}', 'Large loan amount dependent on single income source', 'AI System'],
      [19, 'Income Risk', 'medium', 68.0, '{"self_employed":true,"business_type":"law_firm","years":15}', 'Long-established but self-employed income', 'AI System'],
      [20, 'Capacity Risk', 'high', 48.0, '{"dti":48,"first_time_buyer":true,"credit_score":700}', 'High DTI for first-time buyer with borderline credit', 'AI System'],
    ];
    for (const ra of riskAssessments) {
      await client.query(
        `INSERT INTO risk_assessments (application_id,risk_category,risk_level,score,factors,recommendation,assessed_by) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7)`,
        ra
      );
    }
    console.log('Risk assessments seeded');

    // Seed Audit Logs (16)
    const auditLogs = [
      [1, 'application_created', 'loan_applications', 1, null, '{"status":"submitted"}'],
      [2, 'application_reviewed', 'loan_applications', 1, '{"status":"submitted"}', '{"status":"in_review"}'],
      [1, 'document_uploaded', 'documents', 1, null, '{"name":"W2_2023_John_Smith.pdf"}'],
      [2, 'credit_report_pulled', 'credit_reports', 1, null, '{"bureau":"Experian","score":780}'],
      [3, 'application_created', 'loan_applications', 2, null, '{"status":"submitted"}'],
      [2, 'appraisal_ordered', 'appraisals', 1, null, '{"property_id":1}'],
      [2, 'condition_added', 'conditions', 1, null, '{"description":"Provide pay stubs"}'],
      [1, 'application_approved', 'loan_applications', 3, '{"status":"in_review"}', '{"status":"approved"}'],
      [4, 'compliance_check', 'compliance_checks', 1, null, '{"type":"TRID","result":"pass"}'],
      [2, 'risk_assessment_run', 'risk_assessments', 1, null, '{"risk_level":"low","score":92.5}'],
      [3, 'document_reviewed', 'documents', 6, '{"status":"pending_review"}', '{"status":"approved"}'],
      [1, 'application_created', 'loan_applications', 5, null, '{"status":"submitted"}'],
      [2, 'application_denied', 'loan_applications', 11, '{"status":"in_review"}', '{"status":"denied"}'],
      [4, 'condition_completed', 'conditions', 12, '{"status":"pending"}', '{"status":"completed"}'],
      [1, 'borrower_updated', 'borrowers', 6, '{"credit_score":705}', '{"credit_score":710}'],
      [2, 'fee_calculated', 'fee_schedules', null, null, '{"total_fees":12500}'],
    ];
    for (const al of auditLogs) {
      await client.query(
        `INSERT INTO audit_logs (user_id,action,entity_type,entity_id,old_values,new_values) VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb)`,
        al
      );
    }
    console.log('Audit logs seeded');

    // Seed Notifications (16)
    const notifications = [
      [2, 'New Application Assigned', 'Application APP-2024-001 has been assigned to you for review.', 'info', false, '/applications/1'],
      [2, 'Appraisal Complete', 'Appraisal for 123 Sunset Blvd has been completed. Value: $860,000.', 'success', true, '/appraisals/1'],
      [3, 'Document Upload Required', 'Application APP-2024-002 is missing tax returns. Please follow up with borrower.', 'warning', false, '/applications/2'],
      [2, 'Compliance Alert', 'Application APP-2024-006 failed QM/ATR compliance check. Manual review needed.', 'error', false, '/compliance/10'],
      [4, 'Condition Due Soon', 'Title search condition for APP-2024-004 is due in 5 days.', 'warning', false, '/conditions/8'],
      [1, 'System Update', 'New underwriting rules have been deployed. Please review updated guidelines.', 'info', true, '/rules'],
      [2, 'Risk Assessment Complete', 'AI risk assessment completed for APP-2024-001. Overall risk: LOW.', 'success', true, '/risk/1'],
      [3, 'Application Submitted', 'New application APP-2024-009 submitted by James Thomas.', 'info', false, '/applications/9'],
      [2, 'Urgent: High DTI Application', 'APP-2024-006 has DTI of 45%. Exceeds standard guidelines.', 'error', false, '/applications/6'],
      [4, 'Credit Report Updated', 'Updated credit report received for borrower Sarah Davis. Score: 710.', 'info', false, '/credit-reports/9'],
      [1, 'Weekly Summary', 'This week: 5 new applications, 2 approved, 1 denied, 2 in review.', 'info', true, '/dashboard'],
      [3, 'Document Approved', 'Business license for Robert Johnson has been approved.', 'success', true, '/documents/6'],
      [2, 'Fraud Alert', 'Automated fraud screening flagged no issues for APP-2024-016.', 'success', false, '/risk/13'],
      [4, 'Closing Scheduled', 'Closing for APP-2024-003 scheduled for March 15, 2024.', 'info', false, '/applications/3'],
      [2, 'Rate Lock Expiring', 'Rate lock for APP-2024-005 expires in 7 days. Please take action.', 'warning', false, '/applications/5'],
      [1, 'New User Added', 'Ashley White (intern) has been added to the system.', 'info', true, '/users'],
    ];
    for (const n of notifications) {
      await client.query(
        `INSERT INTO notifications (user_id,title,message,type,is_read,link) VALUES ($1,$2,$3,$4,$5,$6)`,
        n
      );
    }
    console.log('Notifications seeded');

    // Seed Underwriting Rules (16)
    const underwritingRules = [
      ['Minimum Credit Score - Conventional', 'credit', 'credit_score', '>=', '620', 'flag_review', 'error', 'Minimum FICO score for conventional loans'],
      ['Minimum Credit Score - FHA', 'credit', 'credit_score', '>=', '580', 'flag_review', 'error', 'Minimum FICO for FHA loans'],
      ['Maximum DTI - Standard', 'capacity', 'dti_ratio', '<=', '43', 'flag_review', 'warning', 'QM safe harbor DTI limit'],
      ['Maximum DTI - FHA', 'capacity', 'dti_ratio', '<=', '57', 'flag_review', 'warning', 'FHA maximum DTI with compensating factors'],
      ['Maximum LTV - Conventional', 'collateral', 'ltv_ratio', '<=', '97', 'require_pmi', 'info', 'Conventional LTV limit - PMI required above 80%'],
      ['Minimum Down Payment', 'capacity', 'down_payment_pct', '>=', '3', 'deny', 'error', 'Minimum down payment requirement'],
      ['Employment History', 'income', 'years_employed', '>=', '2', 'flag_review', 'warning', 'Standard 2-year employment history requirement'],
      ['Large Deposit Alert', 'assets', 'deposit_amount', '>', '5000', 'require_documentation', 'warning', 'Unexplained large deposits require sourcing'],
      ['Bankruptcy Lookback', 'credit', 'bankruptcy_years', '>=', '4', 'flag_review', 'error', 'Minimum years since bankruptcy discharge'],
      ['Foreclosure Lookback', 'credit', 'foreclosure_years', '>=', '7', 'flag_review', 'error', 'Minimum years since foreclosure'],
      ['Property Condition', 'collateral', 'condition_rating', '!=', 'poor', 'deny', 'error', 'Property must meet minimum condition standards'],
      ['Flood Insurance Required', 'collateral', 'flood_zone', '==', 'true', 'require_insurance', 'warning', 'Flood insurance mandatory for properties in flood zones'],
      ['Jumbo Loan Threshold', 'loan', 'loan_amount', '>', '766550', 'apply_jumbo_rules', 'info', '2024 conforming loan limit for most areas'],
      ['Gift Funds Documentation', 'assets', 'gift_funds', '>', '0', 'require_gift_letter', 'warning', 'Gift letter required for gifted down payment funds'],
      ['Occupancy Verification', 'property', 'occupancy_type', '==', 'primary', 'verify_occupancy', 'info', 'Primary residence claims require verification'],
      ['Income Trending', 'income', 'income_trend', '==', 'declining', 'flag_review', 'warning', 'Declining income trend requires underwriter review'],
    ];
    for (const ur of underwritingRules) {
      await client.query(
        `INSERT INTO underwriting_rules (name,category,condition_field,operator,threshold_value,action,severity,description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        ur
      );
    }
    console.log('Underwriting rules seeded');

    // Seed Pipeline Stages (8)
    const pipelineStages = [
      ['Submitted', 1, '#6366f1', 'Application received and pending initial review', 2],
      ['In Review', 2, '#f59e0b', 'Underwriter actively reviewing the application', 5],
      ['Document Collection', 3, '#8b5cf6', 'Gathering required documentation from borrower', 7],
      ['Appraisal', 4, '#06b6d4', 'Property appraisal ordered and in progress', 10],
      ['Conditional Approval', 5, '#22c55e', 'Approved with conditions that must be satisfied', 5],
      ['Final Review', 6, '#f97316', 'Final underwriting review before clear to close', 3],
      ['Clear to Close', 7, '#10b981', 'All conditions met, ready for closing', 2],
      ['Closed/Funded', 8, '#3b82f6', 'Loan has been closed and funded', 0],
    ];
    for (const ps of pipelineStages) {
      await client.query(
        `INSERT INTO pipeline_stages (name,display_order,color,description,avg_days) VALUES ($1,$2,$3,$4,$5)`,
        ps
      );
    }
    console.log('Pipeline stages seeded');

    console.log('\n✅ All seed data inserted successfully!');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
