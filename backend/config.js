// Minimal .env loader (no extra dependency). Real environment variables win over .env.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '.env');
if (fs.existsSync(file)) {
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

module.exports = {
  port: Number(process.env.PORT) || 5000,
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim()),
  jwtSecret: process.env.JWT_SECRET,
  tokenTtlSeconds: Number(process.env.TOKEN_TTL_SECONDS) || 8 * 3600,
  allowAdminSignup: process.env.ALLOW_ADMIN_SIGNUP === 'true',
  db: process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE || 'ipms',
      },
};
