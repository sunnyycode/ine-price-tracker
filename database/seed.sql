-- INE Product Price Tracker - Seed Data
-- This file is intentionally minimal.
-- Products should be tracked through the application UI by searching the mock store.
-- No fake data is seeded to maintain data integrity.

-- To test the schema, you can verify tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tracked_products', 'price_history', 'scrape_logs', 'scrape_runs');
