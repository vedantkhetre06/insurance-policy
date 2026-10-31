const config = require('./config');
const { Pool, types } = require('pg');
const { createApp } = require('./app');

if (!config.jwtSecret || config.jwtSecret.length < 16) {
  console.error('JWT_SECRET is missing or too short (min 16 chars). Copy backend/.env.example to backend/.env and set it.');
  process.exit(1);
}
types.setTypeParser(1082, (v) => v); // return DATE columns as 'YYYY-MM-DD' strings (no timezone shifts)

const pool = new Pool(config.db);
pool.on('error', (e) => console.error('Postgres pool error:', e.message));

createApp(pool).listen(config.port, () => console.log(`IPMS API running on http://localhost:${config.port}`));
