-- Run this in pgAdmin to check if tables exist and have correct structure

-- Check if research_paper_purchases table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'research_paper_purchases'
);

-- Check if visa_application_purchases table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'visa_application_purchases'
);

-- Check research_paper_purchases columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'research_paper_purchases'
ORDER BY ordinal_position;

-- Check visa_application_purchases columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'visa_application_purchases'
ORDER BY ordinal_position;

-- Count records in each table
SELECT 'research_paper_purchases' as table_name, COUNT(*) as record_count FROM research_paper_purchases
UNION ALL
SELECT 'visa_application_purchases' as table_name, COUNT(*) as record_count FROM visa_application_purchases;

-- Test the relation - check if user_id foreign keys work
SELECT
  rp.purchase_id,
  rp.user_id,
  u.username,
  u.email
FROM research_paper_purchases rp
LEFT JOIN users u ON rp.user_id = u.user_id
LIMIT 5;

SELECT
  vp.purchase_id,
  vp.user_id,
  u.username,
  u.email
FROM visa_application_purchases vp
LEFT JOIN users u ON vp.user_id = u.user_id
LIMIT 5;
