import React, { useState, useEffect } from 'react';


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
