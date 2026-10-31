const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');
const { hashPassword, verifyPassword, signToken, authenticate, authorize } = require('./auth');
const { calculatePremium } = require('./premium');
const V = require('./validate');

const LEGACY_TYPES = { vehicle: ['vehicle', 'auto'], property: ['property', 'home'] }; // original IPMS demo used Auto/Home
const normType = (t) => ({ auto: 'vehicle', home: 'property' }[String(t).toLowerCase()] || String(t).toLowerCase());

const POLICY_COLS = `p.id, p.policy_number, p.user_id, p.holder_name, p.email, p.phone, p.age, p.type, p.status,
  p.start_date, p.end_date, p.sum_assured, p.premium, p.annual_premium, p.payment_frequency, p.details, p.created_at`;
const CLAIM_SELECT = `SELECT c.id, c.claim_number, c.policy_id, p.policy_number, c.holder_name, c.description, c.amount,
  c.status, c.vendor_id, p.type AS policy_type, to_char(c.created_at, 'YYYY-MM-DD') AS filed_date, c.settled_date
  FROM claims c JOIN policies p ON c.policy_id = p.id`;

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function cleanDetails(d) {
  if (d === undefined || d === null) return {};
  if (typeof d !== 'object' || Array.isArray(d)) return d;
  const out = { ...d };
  for (const k of ['familySize', 'term', 'year', 'area']) if (out[k] !== undefined && out[k] !== '') out[k] = Number(out[k]); else delete out[k];
  for (const k of ['smoker', 'preExisting']) if (out[k] !== undefined) out[k] = Boolean(out[k]);
  return out;
}

function createApp(pool) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  const holderUser = async (id) => (await pool.query('SELECT id, email FROM users WHERE id = $1', [id])).rows[0];

  // Row-level scope: admin sees everything; a holder sees own policies (or unlinked ones carrying their email)
  const policyScope = async (user, params) => {
    if (user.role === 'admin') return '';
    params.push(user.id, (user.email || '').toLowerCase());
    return `(p.user_id = $${params.length - 1} OR (p.user_id IS NULL AND lower(p.email) = $${params.length}))`;
  };

  app.get('/api/health', wrap(async (req, res) => { await pool.query('SELECT 1'); res.json({ status: 'ok' }); }));

  // ── AUTH ───────────────────────────────────────────────────────────────────
  app.post('/api/auth/register', wrap(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password, role } = req.body;
    if (!V.EMAIL.test(email) || email.length > 255) return res.status(400).json({ error: 'A valid email is required' });
    if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!['admin', 'holder', 'vendor'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    if (role === 'admin' && !config.allowAdminSignup) {
      const existing = await pool.query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1");
      if (existing.rows.length) return res.status(403).json({ error: 'Administrator accounts cannot be self-registered' });
    }
    try {
      const r = await pool.query(
        'INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role',
        [uuidv4(), email, hashPassword(password), role]);
      res.status(201).json({ ...r.rows[0], token: signToken(r.rows[0]) });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Registration failed or email exists.' });
      throw err;
    }
  }));

  app.post('/api/auth/login', wrap(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = req.body.password;
    if (!email || typeof password !== 'string') return res.status(400).json({ error: 'Email and password are required' });
    const r = await pool.query('SELECT id, email, role, password FROM users WHERE lower(email) = $1', [email]);
    const u = r.rows[0];
    const check = u ? verifyPassword(password, u.password) : { ok: false };
    if (!check.ok) return res.status(401).json({ error: 'Invalid credentials' });
    if (check.legacy) await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashPassword(password), u.id]); // upgrade plaintext rows
    const user = { id: u.id, email: u.email, role: u.role };
    res.json({ ...user, token: signToken(user) });
  }));

  // ── PREMIUM ────────────────────────────────────────────────────────────────
  app.post('/api/calculate-premium', authenticate, (req, res) => {
    const { type, paymentFrequency } = req.body;
    const age = Number(req.body.age); const sumAssured = Number(req.body.sumAssured);
    if (!V.TYPES.includes(type)) return res.status(400).json({ error: 'Valid type is required' });
    if (!Number.isFinite(age) || age < 1 || age > 120) return res.status(400).json({ error: 'Valid age is required' });
    if (!(sumAssured > 0) || sumAssured > V.MAX_MONEY) return res.status(400).json({ error: 'Valid sum assured is required' });
    if (paymentFrequency && !V.FREQUENCIES.includes(paymentFrequency)) return res.status(400).json({ error: 'Invalid payment frequency' });
    res.json(calculatePremium({ type, age, sumAssured, paymentFrequency: paymentFrequency || 'annual', details: cleanDetails(req.body.details) }));
  });

  // ── POLICIES ───────────────────────────────────────────────────────────────
  app.get('/api/policies', authenticate, authorize('admin', 'holder'), wrap(async (req, res) => {
    const params = []; const where = [];
    const scope = await policyScope(req.user, params); if (scope) where.push(scope);
    const { type, status, search } = req.query;
    if (type && type !== 'all') { params.push(LEGACY_TYPES[type] || [String(type).toLowerCase()]); where.push(`lower(p.type) = ANY($${params.length})`); }
    if (status && status !== 'all') { params.push(String(status)); where.push(`p.status = $${params.length}`); }
    if (search) {
      params.push(`%${String(search).replace(/[\\%_]/g, '\\$&')}%`);
      where.push(`(p.holder_name ILIKE $${params.length} OR p.policy_number ILIKE $${params.length} OR p.email ILIKE $${params.length})`);
    }
    const r = await pool.query(`SELECT ${POLICY_COLS} FROM policies p ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY p.created_at DESC`, params);
    res.json(r.rows.map(p => ({ ...p, type: normType(p.type) })));
  }));

  app.get('/api/policies/:id', authenticate, authorize('admin', 'holder'), wrap(async (req, res) => {
    if (!V.UUID.test(req.params.id)) return res.status(404).json({ error: 'Policy not found' });
    const params = [req.params.id]; const scope = await policyScope(req.user, params);
    const r = await pool.query(`SELECT ${POLICY_COLS} FROM policies p WHERE p.id = $1 ${scope ? 'AND ' + scope : ''}`, params);
    if (!r.rows[0]) return res.status(404).json({ error: 'Policy not found' });
    res.json({ ...r.rows[0], type: normType(r.rows[0].type) });
  }));

  const buildPolicy = (base, body) => {
    const b = body || {};
    const pick = (k, d) => (b[k] !== undefined ? b[k] : d);
    const today = new Date().toISOString().slice(0, 10);
    const start = pick('start_date', base.start_date) || today;
    const p = {
      holder_name: String(pick('holder_name', base.holder_name) ?? '').trim(),
      email: String(pick('email', base.email) ?? '').trim().toLowerCase(),
      phone: pick('phone', base.phone) || null,
      age: Number(pick('age', base.age)),
      type: pick('type', base.type),
      status: pick('status', base.status || 'active'),
      sum_assured: Number(pick('sum_assured', base.sum_assured)),
      payment_frequency: pick('payment_frequency', base.payment_frequency) || 'annual',
      start_date: start,
      end_date: pick('end_date', base.end_date) || new Date(Date.parse(start) + 365 * 86400000).toISOString().slice(0, 10),
      details: cleanDetails(pick('details', base.details)),
    };
    return p;
  };

  const savePolicyFields = (p) => {
    const prem = calculatePremium({ type: p.type, age: p.age, sumAssured: p.sum_assured, paymentFrequency: p.payment_frequency, details: p.details });
    return { ...p, premium: prem.perPeriodPremium, annual_premium: prem.annualPremium, prem };
  };

  app.post('/api/policies', authenticate, authorize('admin', 'holder'), wrap(async (req, res) => {
    const p = buildPolicy({}, req.body);
    delete p.status; p.status = 'active';
    if (req.user.role === 'holder') p.email = (req.user.email || '').toLowerCase();
    const err = V.policyError(p);
    if (err) return res.status(400).json({ error: err });
    let ownerId = null;
    if (req.user.role === 'holder') ownerId = req.user.id;
    else ownerId = (await pool.query("SELECT id FROM users WHERE lower(email) = $1 AND role = 'holder'", [p.email])).rows[0]?.id || null;
    const f = savePolicyFields(p);
    const r = await pool.query(
      `INSERT INTO policies (id, user_id, policy_number, holder_name, email, phone, age, type, status, start_date, end_date,
         sum_assured, premium, annual_premium, payment_frequency, details)
       VALUES ($1, $2, 'POL-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('policy_number_seq')::text, 3, '0'),
         $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb)
       RETURNING id`,
      [uuidv4(), ownerId, f.holder_name, f.email, f.phone, f.age, f.type, f.status, f.start_date, f.end_date,
       f.sum_assured, f.premium, f.annual_premium, f.payment_frequency, JSON.stringify(f.details)]);
    const row = (await pool.query(`SELECT ${POLICY_COLS} FROM policies p WHERE p.id = $1`, [r.rows[0].id])).rows[0];
    res.status(201).json({ ...row, type: normType(row.type), premiumBreakdown: f.prem });
  }));

  app.put('/api/policies/:id', authenticate, authorize('admin'), wrap(async (req, res) => {
    if (!V.UUID.test(req.params.id)) return res.status(404).json({ error: 'Policy not found' });
    const cur = (await pool.query('SELECT * FROM policies WHERE id = $1', [req.params.id])).rows[0];
    if (!cur) return res.status(404).json({ error: 'Policy not found' });
    const p = buildPolicy({ ...cur, type: normType(cur.type), start_date: cur.start_date, end_date: cur.end_date, sum_assured: Number(cur.sum_assured) }, req.body);
    const err = V.policyError(p);
    if (err) return res.status(400).json({ error: err });
    let ownerId = cur.user_id;
    if (p.email !== (cur.email || '').toLowerCase()) {
      ownerId = (await pool.query("SELECT id FROM users WHERE lower(email) = $1 AND role = 'holder'", [p.email])).rows[0]?.id || null;
    }
    const f = savePolicyFields(p);
    await pool.query(
      `UPDATE policies SET user_id=$1, holder_name=$2, email=$3, phone=$4, age=$5, type=$6, status=$7, start_date=$8, end_date=$9,
         sum_assured=$10, premium=$11, annual_premium=$12, payment_frequency=$13, details=$14::jsonb WHERE id=$15`,
      [ownerId, f.holder_name, f.email, f.phone, f.age, f.type, f.status, f.start_date, f.end_date,
       f.sum_assured, f.premium, f.annual_premium, f.payment_frequency, JSON.stringify(f.details), req.params.id]);
    const row = (await pool.query(`SELECT ${POLICY_COLS} FROM policies p WHERE p.id = $1`, [req.params.id])).rows[0];
    res.json({ ...row, type: normType(row.type) });
  }));

  app.delete('/api/policies/:id', authenticate, authorize('admin'), wrap(async (req, res) => {
    if (!V.UUID.test(req.params.id)) return res.status(404).json({ error: 'Policy not found' });
    const r = await pool.query('DELETE FROM policies WHERE id = $1', [req.params.id]); // claims cascade (FK)
    if (!r.rowCount) return res.status(404).json({ error: 'Policy not found' });
    res.json({ message: 'Policy deleted successfully' });
  }));

  // ── CLAIMS ─────────────────────────────────────────────────────────────────
  app.get('/api/claims', authenticate, wrap(async (req, res) => {
    const params = []; const where = [];
    if (req.user.role === 'holder') {
      const scope = await policyScope(req.user, params); where.push(scope);
    } else if (req.user.role === 'vendor') {
      where.push("c.status IN ('pending', 'assessing')");
    }
    const { status } = req.query;
    if (status && status !== 'all') { params.push(String(status)); where.push(`c.status = $${params.length}`); }
    const r = await pool.query(`${CLAIM_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY c.created_at DESC`, params);
    res.json(r.rows.map(c => ({ ...c, policy_type: normType(c.policy_type) })));
  }));

  app.post('/api/claims', authenticate, authorize('admin', 'holder'), wrap(async (req, res) => {
    const { policy_id, description } = req.body; const amount = Number(req.body.amount);
    if (!V.UUID.test(policy_id || '')) return res.status(400).json({ error: 'A valid policy is required' });
    if (typeof description !== 'string' || !description.trim() || description.length > 5000) return res.status(400).json({ error: 'Description is required' });
    if (!(amount > 0) || amount > V.MAX_MONEY) return res.status(400).json({ error: 'Claim amount must be a positive number' });
    const params = [policy_id]; const scope = await policyScope(req.user, params);
    const pol = (await pool.query(`SELECT ${POLICY_COLS} FROM policies p WHERE p.id = $1 ${scope ? 'AND ' + scope : ''}`, params)).rows[0];
    if (!pol) return res.status(404).json({ error: 'Policy not found' });
    if (pol.status !== 'active') return res.status(400).json({ error: 'Claims can only be filed against active policies' });
    if (pol.sum_assured !== null && amount > Number(pol.sum_assured)) return res.status(400).json({ error: 'Claim amount exceeds the sum assured' });
    const r = await pool.query(
      `INSERT INTO claims (id, policy_id, claim_number, holder_name, description, amount)
       VALUES ($1, $2, 'CLM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('claim_number_seq')::text, 3, '0'), $3, $4, $5) RETURNING id`,
      [uuidv4(), pol.id, pol.holder_name, description.trim(), amount]);
    const row = (await pool.query(`${CLAIM_SELECT} WHERE c.id = $1`, [r.rows[0].id])).rows[0];
    res.status(201).json({ ...row, policy_type: normType(row.policy_type) });
  }));

  app.put('/api/claims/:id/status', authenticate, authorize('admin', 'vendor'), wrap(async (req, res) => {
    const { status } = req.body;
    if (!V.UUID.test(req.params.id)) return res.status(404).json({ error: 'Claim not found' });
    if (!V.CLAIM_STATUSES.includes(status)) return res.status(400).json({ error: `Status must be one of: ${V.CLAIM_STATUSES.join(', ')}` });
    const cur = (await pool.query('SELECT status FROM claims WHERE id = $1', [req.params.id])).rows[0];
    if (!cur) return res.status(404).json({ error: 'Claim not found' });
    if (req.user.role === 'vendor') {
      if (!['pending', 'assessing'].includes(status) || !['pending', 'assessing'].includes(cur.status)) {
        return res.status(403).json({ error: 'Vendors can only move claims between pending and assessing' });
      }
    }
    const vendorId = req.user.role === 'vendor' ? req.user.id : null;
    await pool.query(
      `UPDATE claims SET status = $1::varchar, vendor_id = COALESCE($2, vendor_id),
         settled_date = CASE WHEN $1::varchar IN ('approved', 'rejected') THEN CURRENT_DATE ELSE NULL END WHERE id = $3`,
      [status, vendorId, req.params.id]);
    const row = (await pool.query(`${CLAIM_SELECT} WHERE c.id = $1`, [req.params.id])).rows[0];
    res.json({ ...row, policy_type: normType(row.policy_type) });
  }));

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  app.get('/api/dashboard', authenticate, authorize('admin', 'holder'), wrap(async (req, res) => {
    const params = []; const scope = await policyScope(req.user, params);
    const pw = scope ? `WHERE ${scope}` : '';
    const pol = await pool.query(
      `SELECT lower(p.type) AS type, p.status, COALESCE(p.annual_premium, p.premium) AS annual,
              (p.status = 'active' AND p.end_date > CURRENT_DATE AND p.end_date <= CURRENT_DATE + 30) AS expiring
         FROM policies p ${pw}`, params);
    const cl = await pool.query(
      `SELECT c.status, c.amount FROM claims c JOIN policies p ON c.policy_id = p.id ${pw}`, params);

    const active = pol.rows.filter(r => r.status === 'active');
    const sum = (rows, f) => rows.reduce((s, r) => s + Number(f(r) || 0), 0);
    const data = {
      totalPolicies: pol.rows.length,
      activePolicies: active.length,
      totalPremium: sum(active, r => r.annual),
      totalClaims: cl.rows.length,
      pendingClaims: cl.rows.filter(c => c.status === 'pending').length,
      totalClaimAmount: sum(cl.rows.filter(c => c.status === 'approved'), c => c.amount),
      expiringSoon: pol.rows.filter(r => r.expiring).length,
      byType: V.TYPES.map(t => {
        const rows = pol.rows.filter(r => normType(r.type) === t);
        return { type: t, count: rows.length, premium: sum(rows.filter(r => r.status === 'active'), r => r.annual) };
      }),
    };
    if (req.user.role === 'admin') {
      data.totalHolders = Number((await pool.query("SELECT COUNT(*) FROM users WHERE role = 'holder'")).rows[0].count);
    }
    res.json(data);
  }));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

module.exports = { createApp };
