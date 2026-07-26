import React, { useState, useEffect } from 'react';

const API = 'http://localhost:5000/api';

const POLICY_TYPES = {
  health: { label: 'Health Insurance', icon: '🏥', color: '#10b981', bg: '#d1fae5' },
  life: { label: 'Life Insurance', icon: '❤️', color: '#3b82f6', bg: '#dbeafe' },
  vehicle: { label: 'Vehicle Insurance', icon: '🚗', color: '#f59e0b', bg: '#fef3c7' },
  property: { label: 'Property Insurance', icon: '🏠', color: '#8b5cf6', bg: '#ede9fe' }
};

const STATUS_COLORS = {
  active: { color: '#10b981', bg: '#d1fae5' },
  expired: { color: '#ef4444', bg: '#fee2e2' },
  pending: { color: '#f59e0b', bg: '#fef3c7' },
  cancelled: { color: '#6b7280', bg: '#f3f4f6' }
};

// ─── API Helpers ──────────────────────────────────────────────────────────────
const api = {
  get: (path) => fetch(`${API}${path}`).then(r => r.json()),
  post: (path, body) => fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  put: (path, body) => fetch(`${API}${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  delete: (path) => fetch(`${API}${path}`, { method: 'DELETE' }).then(r => r.json()),
};

// ─── Utility Components ───────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: s.color, background: s.bg, textTransform: 'capitalize' }}>{status}</span>;
};

const TypeBadge = ({ type }) => {
  const t = POLICY_TYPES[type] || {};
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: t.color, background: t.bg }}>{t.icon} {t.label}</span>;
};

const Card = ({ children, style = {} }) => (
  <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)', ...style }}>
    {children}
  </div>
);

const Stat = ({ label, value, icon, color, sub }) => (
  <Card style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 52, height: 52, borderRadius: 14, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', fontFamily: 'Georgia, serif' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: color, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
    </div>
  </Card>
);

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>}
    <input style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border 0.2s', color: '#0f172a' }}
      onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} {...props} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>}
    <select style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', cursor: 'pointer', color: '#0f172a' }}
      onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} {...props}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Button = ({ children, variant = 'primary', style = {}, ...props }) => {
  const styles = {
    primary: { background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none' },
    secondary: { background: '#f1f5f9', color: '#374151', border: 'none' },
    danger: { background: '#fee2e2', color: '#ef4444', border: 'none' },
    success: { background: '#d1fae5', color: '#10b981', border: 'none' },
    outline: { background: 'transparent', color: '#6366f1', border: '1.5px solid #6366f1' },
  };
  return (
    <button style={{ padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', ...styles[variant], ...style }} {...props}>
      {children}
    </button>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get('/dashboard').then(r => r.success && setStats(r.data)); }, []);

  if (!stats) return <div style={{ textAlign: 'center', padding: 60, color: '#6366f1' }}>Loading dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: 'Georgia, serif', margin: 0 }}>Dashboard Overview</h2>
        <p style={{ color: '#64748b', marginTop: 4 }}>Welcome to your insurance management portal</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <Stat label="Total Policies" value={stats.totalPolicies} icon="📋" color="#6366f1" sub={`${stats.activePolicies} active`} />
        <Stat label="Annual Premium" value={`₹${(stats.totalPremium / 100000).toFixed(1)}L`} icon="💰" color="#10b981" />
        <Stat label="Total Claims" value={stats.totalClaims} icon="📄" color="#f59e0b" sub={`${stats.pendingClaims} pending`} />
        <Stat label="Expiring Soon" value={stats.expiringSoon} icon="⚠️" color="#ef4444" sub="within 30 days" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>📊 Policies by Type</h3>
          {stats.byType.map(t => (
            <div key={t.type} style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ width: 28, fontSize: 18 }}>{POLICY_TYPES[t.type]?.icon}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#374151' }}>{POLICY_TYPES[t.type]?.label}</span>
              <div style={{ width: 120, height: 8, background: '#f1f5f9', borderRadius: 4, marginRight: 10 }}>
                <div style={{ height: '100%', borderRadius: 4, background: POLICY_TYPES[t.type]?.color, width: `${(t.count / stats.totalPolicies) * 100}%` }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', minWidth: 20 }}>{t.count}</span>
            </div>
          ))}
        </Card>

        <Card>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>⚡ Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button onClick={() => onNavigate('policies', 'add')} style={{ width: '100%', textAlign: 'left', padding: '12px 16px' }}>
              ➕ Create New Policy
            </Button>
            <Button variant="secondary" onClick={() => onNavigate('policies')} style={{ width: '100%', textAlign: 'left', padding: '12px 16px' }}>
              📋 View All Policies
            </Button>
            <Button variant="secondary" onClick={() => onNavigate('claims')} style={{ width: '100%', textAlign: 'left', padding: '12px 16px' }}>
              📄 Manage Claims
            </Button>
            <Button variant="secondary" onClick={() => onNavigate('calculator')} style={{ width: '100%', textAlign: 'left', padding: '12px 16px' }}>
              🧮 Premium Calculator
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── PREMIUM CALCULATOR ───────────────────────────────────────────────────────
function Calculator() {
  const [form, setForm] = useState({ type: 'health', age: '', sumAssured: '', paymentFrequency: 'annual', smoker: false, preExisting: false, familySize: 1, vehicleType: 'car', vehicleYear: '', propertyType: 'residential', area: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calc = async () => {
    setLoading(true);
    const details = {};
    if (form.type === 'health') { details.smoker = form.smoker; details.preExisting = form.preExisting; details.familySize = parseInt(form.familySize); }
    if (form.type === 'life') { details.smoker = form.smoker; details.term = 20; }
    if (form.type === 'vehicle') { details.vehicleType = form.vehicleType; details.year = parseInt(form.vehicleYear); }
    if (form.type === 'property') { details.propertyType = form.propertyType; details.area = parseInt(form.area); }
    const r = await api.post('/calculate-premium', { type: form.type, age: parseInt(form.age), sumAssured: parseFloat(form.sumAssured), paymentFrequency: form.paymentFrequency, details });
    setResult(r.data);
    setLoading(false);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: 'Georgia, serif', margin: '0 0 8px' }}>🧮 Premium Calculator</h2>
      <p style={{ color: '#64748b', marginBottom: 28 }}>Get an instant estimate for your insurance premium</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card>
          <h3 style={{ margin: '0 0 20px', fontWeight: 700 }}>Policy Details</h3>
          <Select label="Policy Type" value={form.type} onChange={e => set('type', e.target.value)}
            options={Object.entries(POLICY_TYPES).map(([v, t]) => ({ value: v, label: `${t.icon} ${t.label}` }))} />
          <Input label="Age (years)" type="number" placeholder="e.g. 32" value={form.age} onChange={e => set('age', e.target.value)} />
          <Input label="Sum Assured (₹)" type="number" placeholder="e.g. 500000" value={form.sumAssured} onChange={e => set('sumAssured', e.target.value)} />
          <Select label="Payment Frequency" value={form.paymentFrequency} onChange={e => set('paymentFrequency', e.target.value)}
            options={[{ value: 'annual', label: 'Annual' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'monthly', label: 'Monthly' }]} />

          {form.type === 'health' && <>
            <Select label="Family Size" value={form.familySize} onChange={e => set('familySize', e.target.value)}
              options={[1,2,3,4,5,6].map(n => ({ value: n, label: `${n} member${n > 1 ? 's' : ''}` }))} />
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.smoker} onChange={e => set('smoker', e.target.checked)} /> Smoker
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.preExisting} onChange={e => set('preExisting', e.target.checked)} /> Pre-existing conditions
              </label>
            </div>
          </>}

          {form.type === 'life' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.smoker} onChange={e => set('smoker', e.target.checked)} /> Smoker (+60% loading)
            </label>
          )}

          {form.type === 'vehicle' && <>
            <Select label="Vehicle Type" value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)}
              options={[{ value: 'car', label: '🚗 Car' }, { value: 'bike', label: '🏍 Bike' }, { value: 'truck', label: '🚛 Truck' }]} />
            <Input label="Year of Manufacture" type="number" placeholder="e.g. 2021" value={form.vehicleYear} onChange={e => set('vehicleYear', e.target.value)} />
          </>}

          {form.type === 'property' && <>
            <Select label="Property Type" value={form.propertyType} onChange={e => set('propertyType', e.target.value)}
              options={[{ value: 'residential', label: '🏠 Residential' }, { value: 'commercial', label: '🏢 Commercial' }]} />
            <Input label="Area (sq ft)" type="number" placeholder="e.g. 1500" value={form.area} onChange={e => set('area', e.target.value)} />
          </>}

          <Button onClick={calc} disabled={loading || !form.age || !form.sumAssured} style={{ width: '100%', marginTop: 8 }}>
            {loading ? '⏳ Calculating...' : '⚡ Calculate Premium'}
          </Button>
        </Card>

        <div>
          {result ? (
            <Card style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff' }}>
              <h3 style={{ margin: '0 0 24px', fontWeight: 700, fontSize: 18 }}>💡 Premium Estimate</h3>

              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 20, marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 42, fontWeight: 900, fontFamily: 'Georgia, serif' }}>₹{result.perPeriodPremium?.toLocaleString()}</div>
                <div style={{ opacity: 0.8, fontSize: 14, marginTop: 4 }}>per {form.paymentFrequency === 'monthly' ? 'month' : form.paymentFrequency === 'quarterly' ? 'quarter' : 'year'}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>₹{result.annualPremium?.toLocaleString()}</div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>Annual Base</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>₹{result.finalPremium?.toLocaleString()}</div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>Final Annual</div>
                </div>
              </div>

              <h4 style={{ margin: '0 0 12px', fontSize: 14, opacity: 0.85 }}>Rating Factors Applied:</h4>
              {Object.entries(result.breakdown || {}).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ opacity: 0.8, textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span style={{ fontWeight: 600 }}>{typeof v === 'number' ? `×${v.toFixed(2)}` : v}</span>
                </div>
              ))}
            </Card>
          ) : (
            <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: '#94a3b8', textAlign: 'center' }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>🧮</div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Fill in the details</div>
              <div style={{ fontSize: 14, marginTop: 8 }}>Your premium estimate will appear here</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── POLICY FORM ──────────────────────────────────────────────────────────────
function PolicyForm({ policy, onSave, onCancel }) {
  const [form, setForm] = useState(policy || { holderName: '', email: '', phone: '', age: '', type: 'health', sumAssured: '', paymentFrequency: 'annual', startDate: '', endDate: '', details: {} });
  const [premium, setPremium] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setDetail = (k, v) => setForm(f => ({ ...f, details: { ...f.details, [k]: v } }));

  useEffect(() => {
    if (form.age && form.sumAssured && form.type) {
      const t = setTimeout(() => {
        api.post('/calculate-premium', { type: form.type, age: parseInt(form.age), sumAssured: parseFloat(form.sumAssured), paymentFrequency: form.paymentFrequency, details: form.details })
          .then(r => r.success && setPremium(r.data));
      }, 600);
      return () => clearTimeout(t);
    }
  }, [form.type, form.age, form.sumAssured, form.paymentFrequency, form.details]);

  const submit = async () => {
    setLoading(true);
    const r = policy ? await api.put(`/policies/${policy.id}`, form) : await api.post('/policies', form);
    if (r.success) onSave(r.data);
    setLoading(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: 'Georgia, serif', margin: '0 0 24px' }}>
        {policy ? '✏️ Edit Policy' : '➕ New Policy'}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Card>
          <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: '#374151' }}>Policyholder Details</h3>
          <Input label="Full Name *" placeholder="e.g. Arjun Mehta" value={form.holderName} onChange={e => set('holderName', e.target.value)} />
          <Input label="Email *" type="email" placeholder="email@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
          <Input label="Phone" placeholder="+91-9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} />
          <Input label="Age *" type="number" placeholder="e.g. 32" value={form.age} onChange={e => set('age', e.target.value)} />
          <h3 style={{ margin: '8px 0 16px', fontWeight: 700, color: '#374151' }}>Policy Details</h3>
          <Select label="Policy Type *" value={form.type} onChange={e => set('type', e.target.value)}
            options={Object.entries(POLICY_TYPES).map(([v, t]) => ({ value: v, label: `${t.icon} ${t.label}` }))} />
          <Input label="Sum Assured (₹) *" type="number" placeholder="e.g. 500000" value={form.sumAssured} onChange={e => set('sumAssured', e.target.value)} />
          <Select label="Payment Frequency" value={form.paymentFrequency} onChange={e => set('paymentFrequency', e.target.value)}
            options={[{ value: 'annual', label: 'Annual' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'monthly', label: 'Monthly' }]} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Start Date" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            <Input label="End Date" type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
          </div>
        </Card>

        <div>
          <Card style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 700, color: '#374151' }}>Type-Specific Details</h3>
            {form.type === 'health' && <>
              <Select label="Family Size" value={form.details.familySize || 1} onChange={e => setDetail('familySize', parseInt(e.target.value))}
                options={[1,2,3,4,5,6].map(n => ({ value: n, label: `${n} member${n>1?'s':''}` }))} />
              <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!form.details.smoker} onChange={e => setDetail('smoker', e.target.checked)} /> Smoker
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!form.details.preExisting} onChange={e => setDetail('preExisting', e.target.checked)} /> Pre-existing conditions
                </label>
              </div>
            </>}
            {form.type === 'life' && <>
              <Input label="Beneficiary Name" placeholder="e.g. Spouse Name" value={form.details.beneficiary || ''} onChange={e => setDetail('beneficiary', e.target.value)} />
              <Input label="Policy Term (years)" type="number" placeholder="e.g. 20" value={form.details.term || ''} onChange={e => setDetail('term', parseInt(e.target.value))} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16 }}>
                <input type="checkbox" checked={!!form.details.smoker} onChange={e => setDetail('smoker', e.target.checked)} /> Smoker
              </label>
            </>}
            {form.type === 'vehicle' && <>
              <Select label="Vehicle Type" value={form.details.vehicleType || 'car'} onChange={e => setDetail('vehicleType', e.target.value)}
                options={[{ value: 'car', label: '🚗 Car' }, { value: 'bike', label: '🏍 Bike' }, { value: 'truck', label: '🚛 Truck' }]} />
              <Input label="Make" placeholder="e.g. Toyota" value={form.details.make || ''} onChange={e => setDetail('make', e.target.value)} />
              <Input label="Model" placeholder="e.g. Innova" value={form.details.model || ''} onChange={e => setDetail('model', e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Year" type="number" placeholder="2022" value={form.details.year || ''} onChange={e => setDetail('year', parseInt(e.target.value))} />
                <Input label="Reg. Number" placeholder="GJ01AB1234" value={form.details.regNumber || ''} onChange={e => setDetail('regNumber', e.target.value)} />
              </div>
            </>}
            {form.type === 'property' && <>
              <Select label="Property Type" value={form.details.propertyType || 'residential'} onChange={e => setDetail('propertyType', e.target.value)}
                options={[{ value: 'residential', label: '🏠 Residential' }, { value: 'commercial', label: '🏢 Commercial' }]} />
              <Input label="Area (sq ft)" type="number" placeholder="e.g. 1500" value={form.details.area || ''} onChange={e => setDetail('area', parseInt(e.target.value))} />
              <Input label="Location" placeholder="e.g. Ahmedabad" value={form.details.location || ''} onChange={e => setDetail('location', e.target.value)} />
            </>}
          </Card>

          {premium && (
            <Card style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderLeft: '4px solid #10b981' }}>
              <h4 style={{ margin: '0 0 12px', color: '#065f46', fontWeight: 700 }}>💰 Estimated Premium</h4>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#10b981', fontFamily: 'Georgia, serif' }}>₹{premium.perPeriodPremium?.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: '#047857' }}>per {form.paymentFrequency === 'monthly' ? 'month' : form.paymentFrequency === 'quarterly' ? 'quarter' : 'year'}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Annual: ₹{premium.annualPremium?.toLocaleString()}</div>
            </Card>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button onClick={submit} disabled={loading || !form.holderName || !form.age || !form.sumAssured} style={{ flex: 1 }}>
              {loading ? '⏳ Saving...' : policy ? '💾 Update Policy' : '✅ Create Policy'}
            </Button>
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── POLICIES LIST ────────────────────────────────────────────────────────────
function Policies({ initialAction }) {
  const [policies, setPolicies] = useState([]);
  const [view, setView] = useState(initialAction === 'add' ? 'form' : 'list');
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ type: 'all', status: 'all', search: '' });
  const [selected, setSelected] = useState(null);

  const load = () => {
    const q = new URLSearchParams(filters);
    api.get(`/policies?${q}`).then(r => r.success && setPolicies(r.data));
  };

  useEffect(load, [filters]);

  const deletePolicy = async (id) => {
    if (window.confirm('Delete this policy?')) {
      await api.delete(`/policies/${id}`);
      load();
    }
  };

  if (view === 'form') return <PolicyForm policy={editing} onSave={() => { setView('list'); setEditing(null); load(); }} onCancel={() => { setView('list'); setEditing(null); }} />;

  if (selected) return <PolicyDetail policy={selected} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setView('form'); setSelected(null); }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: 'Georgia, serif', margin: 0 }}>All Policies</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>{policies.length} policies found</p>
        </div>
        <Button onClick={() => setView('form')}>➕ New Policy</Button>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
          <Input placeholder="🔍 Search by name, email, policy number..." value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
          <Select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
            options={[{ value: 'all', label: 'All Types' }, ...Object.entries(POLICY_TYPES).map(([v, t]) => ({ value: v, label: `${t.icon} ${t.label}` }))]} />
          <Select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            options={[{ value: 'all', label: 'All Status' }, { value: 'active', label: '✅ Active' }, { value: 'expired', label: '❌ Expired' }, { value: 'cancelled', label: '⛔ Cancelled' }]} />
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {policies.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No policies found</div>
          </Card>
        ) : policies.map(p => (
          <Card key={p.id} style={{ cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.15)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: POLICY_TYPES[p.type]?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {POLICY_TYPES[p.type]?.icon}
              </div>
              <div style={{ flex: 1 }} onClick={() => setSelected(p)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{p.holderName}</span>
                  <Badge status={p.status} />
                  <TypeBadge type={p.type} />
                </div>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  {p.policyNumber} • {p.email} • Age {p.age}
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                  Sum Assured: <strong>₹{p.sumAssured?.toLocaleString()}</strong> • Premium: <strong style={{ color: '#10b981' }}>₹{p.premium?.toLocaleString()}/{p.paymentFrequency === 'monthly' ? 'mo' : p.paymentFrequency === 'quarterly' ? 'qtr' : 'yr'}</strong> • Expires: {p.endDate}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Button variant="outline" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => { setEditing(p); setView('form'); }}>✏️</Button>
                <Button variant="danger" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => deletePolicy(p.id)}>🗑️</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── POLICY DETAIL ────────────────────────────────────────────────────────────
function PolicyDetail({ policy: p, onClose, onEdit }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Button variant="secondary" onClick={onClose}>← Back</Button>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: 'Georgia, serif', margin: 0, flex: 1 }}>Policy Details</h2>
        <Button onClick={onEdit}>✏️ Edit</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: POLICY_TYPES[p.type]?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
              {POLICY_TYPES[p.type]?.icon}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{p.holderName}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{p.policyNumber}</div>
            </div>
          </div>
          {[['Email', p.email], ['Phone', p.phone], ['Age', `${p.age} years`], ['Status', ''], ['Type', '']].map(([k, v]) => (
            k === 'Status' ? <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>Status</span><Badge status={p.status} />
            </div> : k === 'Type' ? <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>Type</span><TypeBadge type={p.type} />
            </div> : v ? <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>{k}</span><span style={{ fontWeight: 600, color: '#0f172a' }}>{v}</span>
            </div> : null
          ))}
        </Card>
        <Card>
          <h3 style={{ margin: '0 0 16px', fontWeight: 700 }}>Financial Details</h3>
          {[['Sum Assured', `₹${p.sumAssured?.toLocaleString()}`], ['Premium', `₹${p.premium?.toLocaleString()} / ${p.paymentFrequency}`], ['Start Date', p.startDate], ['End Date', p.endDate]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>{k}</span><span style={{ fontWeight: 600, color: '#0f172a' }}>{v}</span>
            </div>
          ))}
          <h3 style={{ margin: '20px 0 12px', fontWeight: 700 }}>Additional Details</h3>
          {Object.entries(p.details || {}).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
              <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
              <span style={{ fontWeight: 600 }}>{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── CLAIMS ───────────────────────────────────────────────────────────────────
function Claims() {
  const [claims, setClaims] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ policyId: '', description: '', amount: '' });
  const [statusFilter, setStatusFilter] = useState('all');

  const load = () => {
    const q = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    api.get(`/claims${q}`).then(r => r.success && setClaims(r.data));
    api.get('/policies?status=active').then(r => r.success && setPolicies(r.data));
  };

  useEffect(load, [statusFilter]);

  const submit = async () => {
    const r = await api.post('/claims', form);
    if (r.success) { setShowForm(false); setForm({ policyId: '', description: '', amount: '' }); load(); }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/claims/${id}`, { status });
    load();
  };

  const CLAIM_STATUS_COLORS = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: 'Georgia, serif', margin: 0 }}>Claims Management</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Track and process insurance claims</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>📄 File New Claim</Button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 20, borderLeft: '4px solid #6366f1' }}>
          <h3 style={{ margin: '0 0 16px', fontWeight: 700 }}>File a New Claim</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Select label="Policy *" value={form.policyId} onChange={e => setForm(f => ({ ...f, policyId: e.target.value }))}
              options={[{ value: '', label: 'Select Policy...' }, ...policies.map(p => ({ value: p.id, label: `${p.policyNumber} — ${p.holderName}` }))]} />
            <Input label="Claim Amount (₹) *" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <div />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Description *</label>
            <textarea style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' }}
              placeholder="Describe the incident..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={submit} disabled={!form.policyId || !form.amount || !form.description}>✅ Submit Claim</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div style={{ marginBottom: 16 }}>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          options={[{ value: 'all', label: 'All Claims' }, { value: 'pending', label: '⏳ Pending' }, { value: 'approved', label: '✅ Approved' }, { value: 'rejected', label: '❌ Rejected' }]} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {claims.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
            <div>No claims found</div>
          </Card>
        ) : claims.map(c => (
          <Card key={c.id}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: CLAIM_STATUS_COLORS[c.status] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {POLICY_TYPES[c.type]?.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{c.claimNumber}</span>
                  <Badge status={c.status} />
                  <TypeBadge type={c.type} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{c.holderName} • {c.policyNumber}</div>
                <div style={{ fontSize: 13, color: '#64748b', margin: '4px 0' }}>{c.description}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  Filed: {c.filedDate} {c.settledDate && `• Settled: ${c.settledDate}`}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', fontFamily: 'Georgia, serif' }}>₹{c.amount?.toLocaleString()}</div>
                {c.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <Button variant="success" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => updateStatus(c.id, 'approved')}>✅ Approve</Button>
                    <Button variant="danger" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => updateStatus(c.id, 'rejected')}>❌ Reject</Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('dashboard');
  const [pageAction, setPageAction] = useState(null);

  const navigate = (p, action = null) => { setPage(p); setPageAction(action); };

  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'policies', label: 'Policies', icon: '📋' },
    { id: 'claims', label: 'Claims', icon: '📄' },
    { id: 'calculator', label: 'Calculator', icon: '🧮' },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f8fafc', minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)', padding: '0', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', left: 0, top: 0 }}>
        <div style={{ padding: '28px 24px 24px' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'Georgia, serif', letterSpacing: -0.5 }}>🛡️ InsureHub</div>
          <div style={{ fontSize: 11, color: '#a5b4fc', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Policy Management</div>
        </div>
        <nav style={{ flex: 1, padding: '0 12px' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => navigate(n.id)}
              style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: 12, marginBottom: 4, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
                background: page === n.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: page === n.id ? '#fff' : '#a5b4fc' }}>
              <span style={{ marginRight: 10 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 11, color: '#6d71a3' }}>Insurance Policy Management</div>
          <div style={{ fontSize: 11, color: '#6d71a3' }}>v1.0.0 • React + Node.js</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 240, flex: 1, padding: 32, minHeight: '100vh' }}>
        {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {page === 'policies' && <Policies initialAction={pageAction} key={pageAction} />}
        {page === 'claims' && <Claims />}
        {page === 'calculator' && <Calculator />}
      </div>
    </div>
  );
}
