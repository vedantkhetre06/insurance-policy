// Idempotent DB setup: creates the base schema only if absent, then applies additive migrations.
// Never drops, truncates or rewrites existing data.
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { Pool } = require('pg');

(async () => {
  const pool = new Pool(config.db);
  try {
    const exists = await pool.query("SELECT to_regclass('public.users') AS t");
    if (!exists.rows[0].t) {
      await pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
      console.log('Base schema created (schema.sql).');
    } else {
      console.log('Base schema already present - left untouched.');
    }
    const dir = path.join(__dirname, 'migrations');
    for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.sql')).sort()) {
      await pool.query('BEGIN');
      try { await pool.query(fs.readFileSync(path.join(dir, f), 'utf8')); await pool.query('COMMIT'); console.log(`Applied ${f}`); }
      catch (e) { await pool.query('ROLLBACK'); throw e; }
    }
    console.log('Database ready.');
  } catch (e) {
    console.error('Database setup failed:', e.message);
    process.exitCode = 1;
  } finally { await pool.end(); }
})();
