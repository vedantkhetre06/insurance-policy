// Authenticated API client. Maps the backend's snake_case rows to the camelCase
// shape used by the UI components and back again.
const BASE = import.meta.env.VITE_API_URL || '/api';
const KEY = 'ipms_user'; // session identity + signed token only; all business data lives in PostgreSQL

export const session = {
  get: () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
  set: (u) => localStorage.setItem(KEY, JSON.stringify(u)),
  clear: () => localStorage.removeItem(KEY),
};

const num = (v) => (v === null || v === undefined ? v : Number(v));

export const fromPolicy = (r) => ({
  id: r.id, policyNumber: r.policy_number, holderName: r.holder_name, email: r.email, phone: r.phone,
  age: r.age, type: r.type, status: r.status, startDate: r.start_date, endDate: r.end_date,
  sumAssured: num(r.sum_assured), premium: num(r.premium), annualPremium: num(r.annual_premium),
  paymentFrequency: r.payment_frequency, details: r.details || {},
});

export const toPolicy = (f) => ({
  holder_name: f.holderName, email: f.email, phone: f.phone, age: f.age, type: f.type,
  sum_assured: f.sumAssured, payment_frequency: f.paymentFrequency,
  start_date: f.startDate || undefined, end_date: f.endDate || undefined,
  status: f.status, details: f.details,
});

export const fromClaim = (r) => ({
  id: r.id, claimNumber: r.claim_number, policyId: r.policy_id, policyNumber: r.policy_number,
  holderName: r.holder_name, type: r.policy_type, description: r.description, amount: num(r.amount),
  status: r.status, filedDate: r.filed_date, settledDate: r.settled_date,
});

async function request(method, path, body) {
  const user = session.get();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (res.status === 401 && user) { session.clear(); window.location.reload(); }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

const pathOnly = (p) => p.split('?')[0];

// Same call surface the UI was written against: api.get/post/put/delete(path, body)
export const api = {
  async get(path) {
    const d = await request('GET', path);
    const p = pathOnly(path);
    if (p === '/policies') return d.map(fromPolicy);
    if (/^\/policies\/[^/]+$/.test(p)) return fromPolicy(d);
    if (p === '/claims') return d.map(fromClaim);
    return d;
  },
  async post(path, body) {
    if (path === '/policies') return fromPolicy(await request('POST', path, toPolicy(body)));
    if (path === '/claims') {
      return fromClaim(await request('POST', path, { policy_id: body.policyId, description: body.description, amount: body.amount }));
    }
    if (path === '/calculate-premium') return request('POST', path, body);
    return request('POST', path, body);
  },
  async put(path, body) {
    if (/^\/policies\/[^/]+$/.test(path)) return fromPolicy(await request('PUT', path, toPolicy(body)));
    if (/^\/claims\/[^/]+\/status$/.test(path)) return fromClaim(await request('PUT', path, body));
    return request('PUT', path, body);
  },
  delete: (path) => request('DELETE', path),
};
