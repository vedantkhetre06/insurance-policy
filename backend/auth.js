const crypto = require('crypto');
const config = require('./config');

const b64 = (b) => Buffer.from(b).toString('base64url');

// scrypt password hashing: "scrypt$<salt>$<hash>"
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Returns { ok, legacy }. `legacy` = stored value was the original plaintext format (to be upgraded).
function verifyPassword(password, stored) {
  if (typeof stored === 'string' && stored.startsWith('scrypt$')) {
    const [, salt, hash] = stored.split('$');
    return { ok: safeEqual(crypto.scryptSync(password, salt, 64).toString('hex'), hash), legacy: false };
  }
  return { ok: safeEqual(password, stored || ''), legacy: true };
}

// Compact HS256 signed token (same wire format as a JWT)
function signToken(user) {
  const head = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64(JSON.stringify({ sub: user.id, role: user.role, email: user.email, exp: Math.floor(Date.now() / 1000) + config.tokenTtlSeconds }));
  const sig = crypto.createHmac('sha256', config.jwtSecret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}

function verifyToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const expected = crypto.createHmac('sha256', config.jwtSecret).update(`${parts[0]}.${parts[1]}`).digest('base64url');
  if (!safeEqual(parts[2], expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (!p.exp || p.exp < Date.now() / 1000) return null;
    return { id: p.sub, role: p.role, email: p.email };
  } catch { return null; }
}

const authenticate = (req, res, next) => {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  const user = m && verifyToken(m[1]);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  next();
};

const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Forbidden' });

module.exports = { hashPassword, verifyPassword, signToken, verifyToken, authenticate, authorize };
