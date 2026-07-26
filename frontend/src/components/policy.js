import react from "react";


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

