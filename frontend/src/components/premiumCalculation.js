import React from "react";
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
