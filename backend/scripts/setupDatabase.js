const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = require('../src/config/env');
const logger = require('../src/utils/logger');

async function testSupabase() {
  logger.info('DB_SETUP', 'Testing Supabase connection...');

  if (!SUPABASE_URL || SUPABASE_URL.includes('your-project') || !SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.includes('your-service-role')) {
    logger.error('DB_SETUP', 'Supabase credentials are not configured in backend/.env!');
    logger.error('DB_SETUP', 'Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const tables = ['tracked_products', 'price_history', 'scrape_logs', 'scrape_runs'];
  let allGood = true;

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        logger.warn('DB_SETUP', `Table "${table}" does not exist yet. Please run database/schema.sql in Supabase SQL Editor.`);
      } else {
        logger.error('DB_SETUP', `Error checking table "${table}": ${error.message}`);
      }
      allGood = false;
    } else {
      logger.info('DB_SETUP', `Table "${table}" verified! (${data.length} records found)`);
    }
  }

  if (allGood) {
    logger.info('DB_SETUP', 'All Supabase tables are ready and accessible!');
  } else {
    logger.warn('DB_SETUP', 'Some tables are missing. Copy database/schema.sql into Supabase SQL Editor and click Run.');
  }
}

testSupabase();
