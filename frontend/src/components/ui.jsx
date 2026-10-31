import React from 'react';

export const POLICY_TYPES = {
  health: { label: 'Health Insurance', icon: '🏥', color: '#10b981', bg: '#d1fae5' },
  life: { label: 'Life Insurance', icon: '❤️', color: '#3b82f6', bg: '#dbeafe' },
  vehicle: { label: 'Vehicle Insurance', icon: '🚗', color: '#f59e0b', bg: '#fef3c7' },
  property: { label: 'Property Insurance', icon: '🏠', color: '#8b5cf6', bg: '#ede9fe' }
};

export const STATUS_COLORS = {
  active: { color: '#10b981', bg: '#d1fae5' },
  expired: { color: '#ef4444', bg: '#fee2e2' },
  pending: { color: '#f59e0b', bg: '#fef3c7' },
  assessing: { color: '#3b82f6', bg: '#dbeafe' },
  approved: { color: '#10b981', bg: '#d1fae5' },
  rejected: { color: '#ef4444', bg: '#fee2e2' },
  cancelled: { color: '#6b7280', bg: '#f3f4f6' }
};

// ─── Utility Components ───────────────────────────────────────────────────────
export const Badge = ({ status }) => {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: s.color, background: s.bg, textTransform: 'capitalize' }}>{status}</span>;
};

export const TypeBadge = ({ type }) => {
  const t = POLICY_TYPES[type] || { label: type, icon: '📄', color: '#64748b', bg: '#f1f5f9' };
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: t.color, background: t.bg }}>{t.icon} {t.label}</span>;
};

export const Card = ({ children, style = {} }) => (
  <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)', ...style }}>
    {children}
  </div>
);

export const Stat = ({ label, value, icon, color, sub }) => (
  <Card style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 52, height: 52, borderRadius: 14, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', fontFamily: 'Georgia, serif' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: color, fontWeight: 600, marginTop: 2 }}>{sub}</div>}
    </div>
  </Card>
);

export const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>}
    <input style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border 0.2s', color: '#0f172a' }}
      onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} {...props} />
  </div>
);

export const Select = ({ label, options, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>}
    <select style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', cursor: 'pointer', color: '#0f172a' }}
      onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} {...props}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

export const Button = ({ children, variant = 'primary', style = {}, ...props }) => {
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

