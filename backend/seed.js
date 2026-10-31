// Optional demo data (the 4 policies / 2 claims from the original in-memory app). Only runs on an empty policies table.
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');
const { Pool } = require('pg');
const { hashPassword } = require('./auth');
const { calculatePremium } = require('./premium');

const SAMPLE = [
  ['Arjun Mehta', 'arjun.mehta@email.com', '+91-9876543210', 32, 'health', 'active', '2024-01-15', '2025-01-14', 500000, 'annual', { preExisting: false, smoker: false, familySize: 3 }],
  ['Priya Sharma', 'priya.sharma@email.com', '+91-9845001234', 28, 'life', 'active', '2024-03-01', '2044-02-28', 2000000, 'annual', { term: 20, beneficiary: 'Rahul Sharma', smoker: false }],
  ['Vikram Singh', 'vikram.singh@email.com', '+91-9712345678', 45, 'vehicle', 'active', '2024-06-10', '2025-06-09', 800000, 'annual', { vehicleType: 'car', make: 'Toyota', model: 'Innova', year: 2022, regNumber: 'GJ01AB1234' }],
  ['Meera Patel', 'meera.patel@email.com', '+91-9988776655', 38, 'property', 'expired', '2023-01-01', '2024-01-01', 3500000, 'annual', { propertyType: 'residential', area: 1500, location: 'Ahmedabad' }],
];

(async () => {
  const pool = new Pool(config.db);
  try {
    if ((await pool.query('SELECT COUNT(*) FROM policies')).rows[0].count !== '0') { console.log('Policies already exist - seed skipped.'); return; }
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@ipms.local';
    let pw = process.env.SEED_ADMIN_PASSWORD; const generated = !pw;
    if (generated) pw = crypto.randomBytes(9).toString('base64url');
    const admin = await pool.query(
      `INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id`, [uuidv4(), email, hashPassword(pw)]);
    const ids = [];
    for (const [name, mail, phone, age, type, status, start, end, sum, freq, details] of SAMPLE) {
      const prem = calculatePremium({ type, age, sumAssured: sum, paymentFrequency: freq, details });
      const r = await pool.query(
        `INSERT INTO policies (id, user_id, policy_number, holder_name, email, phone, age, type, status, start_date, end_date,
           sum_assured, premium, annual_premium, payment_frequency, details)
         VALUES ($1, NULL, 'POL-' || to_char($10::date, 'YYYY') || '-' || lpad(nextval('policy_number_seq')::text, 3, '0'),
           $2, $3, $4, $5, $6, $7, $8, $9, $11, $12, $13, $14, $15::jsonb) RETURNING id`,
        [uuidv4(), name, mail, phone, age, type, status, start, end, start, sum, prem.perPeriodPremium, prem.annualPremium, freq, JSON.stringify(details)]);
      ids.push(r.rows[0].id);
    }
    const claims = [[ids[0], 'Arjun Mehta', 'Hospitalization for appendix surgery', 85000, 'approved', '2024-08-20', '2024-08-30'],
                    [ids[2], 'Vikram Singh', 'Accident damage to front bumper and hood', 45000, 'pending', '2024-11-05', null]];
    for (const [pid, name, desc, amt, status, filed, settled] of claims) {
      await pool.query(
        `INSERT INTO claims (id, policy_id, claim_number, holder_name, description, amount, status, created_at, settled_date)
         VALUES ($1, $2, 'CLM-' || to_char($7::date, 'YYYY') || '-' || lpad(nextval('claim_number_seq')::text, 3, '0'), $3, $4, $5, $6, $7::date, $8)`,
        [uuidv4(), pid, name, desc, amt, status, filed, settled]);
    }
    console.log(`Seeded 4 policies and 2 claims. Admin login: ${email}${generated ? ` / ${pw}  (generated - save it now)` : ''}`);
  } catch (e) { console.error('Seed failed:', e.message); process.exitCode = 1; }
  finally { await pool.end(); }
})();
