import React, { useState } from 'react';
import SignLogin from './components/SignLogin';
import VendorPortal from './components/VendorPortal';
import Dashboard from './components/Dashboard';
import Policies from './components/Policies';
import Claims from './components/Claims';
import Calculator from './components/Calculator';
import { session } from './api';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'holder'] },
  { id: 'policies', label: 'Policies', icon: '📋', roles: ['admin', 'holder'] },
  { id: 'claims', label: 'Claims', icon: '📄', roles: ['admin', 'holder'] },
  { id: 'calculator', label: 'Calculator', icon: '🧮', roles: ['admin', 'holder', 'vendor'] },
  { id: 'assessments', label: 'Assessments', icon: '🔎', roles: ['vendor'] },
];

export default function App() {
  const [user, setUser] = useState(() => session.get());
  const [page, setPage] = useState(null);
  const [pageAction, setPageAction] = useState(null);

  if (!user) return <SignLogin setUser={(u) => { session.set(u); setUser(u); setPage(null); }} />;

  const nav = NAV.filter(n => n.roles.includes(user.role));
  const current = page && nav.some(n => n.id === page) ? page : nav[0].id;
  const navigate = (p, action = null) => { setPage(p); setPageAction(action); };
  const logout = () => { session.clear(); setUser(null); setPage(null); };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f8fafc', minHeight: '100vh', display: 'flex' }}>
      <div style={{ width: 240, background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', left: 0, top: 0 }}>
        <div style={{ padding: '28px 24px 24px' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'Georgia, serif', letterSpacing: -0.5 }}>🛡️ InsureHub</div>
          <div style={{ fontSize: 11, color: '#a5b4fc', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Policy Management</div>
        </div>
        <nav style={{ flex: 1, padding: '0 12px' }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => navigate(n.id)}
              style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: 12, marginBottom: 4, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                background: current === n.id ? 'rgba(255,255,255,0.15)' : 'transparent', color: current === n.id ? '#fff' : '#a5b4fc' }}>
              <span style={{ marginRight: 10 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 12, color: '#c7d2fe', wordBreak: 'break-all' }}>{user.email}</div>
          <div style={{ fontSize: 11, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 1, margin: '2px 0 10px' }}>{user.role}</div>
          <button onClick={logout} style={{ width: '100%', padding: '8px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      <div style={{ marginLeft: 240, flex: 1, padding: 32, minHeight: '100vh' }}>
        {current === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {current === 'policies' && <Policies user={user} initialAction={pageAction} key={pageAction} />}
        {current === 'claims' && <Claims role={user.role} />}
        {current === 'calculator' && <Calculator />}
        {current === 'assessments' && <VendorPortal user={user} />}
      </div>
    </div>
  );
}
