// Route-level tests that need NO database: auth, authorization, validation and premium maths.
// SQL paths (CRUD persistence) are NOT covered here - they need a live PostgreSQL (see README "Verify").
process.env.JWT_SECRET = 'test-secret-test-secret-123456';
const assert = require('node:assert/strict');
const { createApp } = require('../app');
const { signToken, verifyToken, hashPassword, verifyPassword } = require('../auth');
const { calculatePremium } = require('../premium');

let calls = [];
const pool = { query: async (sql, p) => { calls.push(sql); if (/INSERT INTO users/.test(sql)) return { rows: [{ id: p[0], email: p[1], role: p[3] }] }; if (/SELECT 1 FROM users WHERE role = 'admin'/.test(sql)) return { rows: [{}] }; throw new Error('DB should not be reached'); } };
const server = createApp(pool).listen(0);
const base = `http://127.0.0.1:${server.address().port}/api`;
const tok = (role) => signToken({ id: '11111111-1111-1111-1111-111111111111', email: `${role}@x.com`, role });
const call = async (method, path, { token, body } = {}) => {
  const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body && JSON.stringify(body) });
  return { status: r.status, json: await r.json().catch(() => null) };
};
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('  ok -', name); };

(async () => {
  await t('password hashing + legacy plaintext verify', () => {
    const h = hashPassword('secret123'); assert.equal(verifyPassword('secret123', h).ok, true); assert.equal(verifyPassword('nope', h).ok, false);
    assert.deepEqual(verifyPassword('plain', 'plain'), { ok: true, legacy: true });
  });
  await t('token round-trip, tamper and expiry rejected', () => {
    const k = tok('admin'); assert.equal(verifyToken(k).role, 'admin');
    assert.equal(verifyToken(k.slice(0, -2) + 'xx'), null);
    const [h, b, s] = k.split('.'); const forged = Buffer.from(JSON.stringify({ sub: 'a', role: 'admin', exp: 9999999999 })).toString('base64url');
    assert.equal(verifyToken(`${h}.${forged}.${s}`), null);
  });
  await t('premium: health matches original formula', () => {
    const r = calculatePremium({ type: 'health', age: 32, sumAssured: 500000, paymentFrequency: 'annual', details: { familySize: 3 } });
    assert.equal(r.annualPremium, Math.round(500000 * 0.02 * 1.3 * 1.5)); // 19500
    const m = calculatePremium({ type: 'life', age: 28, sumAssured: 2000000, paymentFrequency: 'monthly', details: { term: 20 } });
    assert.equal(m.annualPremium, Math.round(2000000 * 0.008 * 1.0 * 1.2)); assert.equal(m.perPeriodPremium, Math.round(Math.round(2000000 * 0.008 * 1.2 * 1.05) / 12));
  });
  await t('401 without / with forged x-user headers', async () => {
    assert.equal((await call('GET', '/policies')).status, 401);
    const r = await fetch(base + '/policies', { headers: { 'x-user-id': 'a', 'x-user-role': 'admin' } }); assert.equal(r.status, 401);
  });
  await t('role enforcement', async () => {
    assert.equal((await call('GET', '/policies', { token: tok('vendor') })).status, 403);
    assert.equal((await call('DELETE', '/policies/11111111-1111-1111-1111-111111111111', { token: tok('holder') })).status, 403);
    assert.equal((await call('PUT', '/policies/11111111-1111-1111-1111-111111111111', { token: tok('holder'), body: {} })).status, 403);
    assert.equal((await call('GET', '/dashboard', { token: tok('vendor') })).status, 403);
    assert.equal((await call('PUT', '/claims/11111111-1111-1111-1111-111111111111/status', { token: tok('holder'), body: { status: 'approved' } })).status, 403);
    assert.equal((await call('POST', '/claims', { token: tok('vendor'), body: {} })).status, 403);
  });
  await t('input validation (no DB reached)', async () => {
    calls = [];
    const bad = await call('POST', '/policies', { token: tok('admin'), body: { holder_name: 'A', email: 'nope', age: 30, type: 'health', sum_assured: 1000 } }); assert.equal(bad.status, 400);
    assert.equal((await call('POST', '/policies', { token: tok('holder'), body: { holder_name: 'A', age: 0, type: 'health', sum_assured: 1000 } })).status, 400);
    assert.equal((await call('POST', '/claims', { token: tok('holder'), body: { policy_id: 'not-a-uuid', description: 'x', amount: 5 } })).status, 400);
    assert.equal((await call('POST', '/claims', { token: tok('holder'), body: { policy_id: '11111111-1111-1111-1111-111111111111', description: 'x', amount: -5 } })).status, 400);
    assert.equal((await call('PUT', '/claims/11111111-1111-1111-1111-111111111111/status', { token: tok('admin'), body: { status: 'bogus' } })).status, 400);
    assert.equal(calls.length, 0);
  });
  await t('/calculate-premium endpoint', async () => {
    const ok = await call('POST', '/calculate-premium', { token: tok('holder'), body: { type: 'vehicle', age: 40, sumAssured: 800000, paymentFrequency: 'quarterly', details: { vehicleType: 'bike', year: 2020 } } });
    assert.equal(ok.status, 200); assert.ok(ok.json.perPeriodPremium > 0);
    assert.equal((await call('POST', '/calculate-premium', { token: tok('holder'), body: { type: 'boat', age: 40, sumAssured: 1 } })).status, 400);
    assert.equal((await call('POST', '/calculate-premium', { body: {} })).status, 401);
  });
  await t('register validation + admin self-signup blocked once an admin exists', async () => {
    assert.equal((await call('POST', '/auth/register', { body: { email: 'bad', password: 'longenough', role: 'holder' } })).status, 400);
    assert.equal((await call('POST', '/auth/register', { body: { email: 'a@b.co', password: 'short', role: 'holder' } })).status, 400);
    assert.equal((await call('POST', '/auth/register', { body: { email: 'a@b.co', password: 'longenough', role: 'admin' } })).status, 403);
    const ok = await call('POST', '/auth/register', { body: { email: 'A@B.co', password: 'longenough', role: 'holder' } });
    assert.equal(ok.status, 201); assert.equal(ok.json.email, 'a@b.co'); assert.ok(verifyToken(ok.json.token));
  });
  server.close(); console.log(`\n${n} test groups passed (DB-free). CRUD/persistence NOT tested here.`);
})().catch((e) => { console.error('FAIL:', e); server.close(); process.exit(1); });
