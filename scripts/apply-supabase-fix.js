#!/usr/bin/env node
/**
 * Applies supabase/fix-schema.sql using DATABASE_URL (direct Postgres).
 * Get URI from Supabase → Project Settings → Database → Connection string → URI
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  console.error('Set DATABASE_URL in .env (Supabase → Database → Connection string → URI)');
  process.exit(1);
}

const sqlPath = path.join(__dirname, '../supabase/fix-schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function main() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await pool.query(sql);
    console.log('✅ Supabase schema fix applied.');
  } catch (e) {
    if (e.message?.includes('already member of publication')) {
      console.log('✅ Schema applied (realtime table already in publication).');
    } else {
      console.error('❌', e.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main();
