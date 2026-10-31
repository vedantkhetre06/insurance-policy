import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Card, Input, Select, Button, Badge, TypeBadge, POLICY_TYPES } from './ui';

export default function Claims({ role }) {
  const [claims, setClaims] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ policyId: '', description: '', amount: '' });
  const [statusFilter, setStatusFilter] = useState('all');

  const [error, setError] = useState('');
  const load = () => {
    const q = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    api.get(`/claims${q}`).then(setClaims).catch(e => setError(e.message));
    if (role !== 'vendor') api.get('/policies?status=active').then(setPolicies).catch(() => {});
  };

  useEffect(load, [statusFilter]);

  const submit = async () => {
    try {
      await api.post('/claims', form);
      setShowForm(false); setForm({ policyId: '', description: '', amount: '' }); setError(''); load();
    } catch (e) { setError(e.message); }
  };

  const updateStatus = async (id, status) => {
    try { await api.put(`/claims/${id}/status`, { status }); setError(''); load(); } catch (e) { setError(e.message); }
  };

  const CLAIM_STATUS_COLORS = { pending: '#f59e0b', assessing: '#3b82f6', approved: '#10b981', rejected: '#ef4444' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: 'Georgia, serif', margin: 0 }}>Claims Management</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Track and process insurance claims</p>
        </div>
        {role !== 'vendor' && <Button onClick={() => setShowForm(!showForm)}>📄 File New Claim</Button>}
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

      {error && <Card style={{ marginBottom: 16, color: '#ef4444' }}>{error}</Card>}
      <div style={{ marginBottom: 16 }}>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          options={[{ value: 'all', label: 'All Claims' }, { value: 'pending', label: '⏳ Pending' }, { value: 'assessing', label: '🔎 Assessing' }, { value: 'approved', label: '✅ Approved' }, { value: 'rejected', label: '❌ Rejected' }]} />
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
                {role === 'admin' && (c.status === 'pending' || c.status === 'assessing') && (
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

