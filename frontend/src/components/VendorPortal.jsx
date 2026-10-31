import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ClipboardList, CheckCircle } from 'lucide-react';

export default function VendorPortal({ user }) {
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState('');

  const fetchClaims = async () => {
    try { setClaims(await api.get('/claims')); setError(''); } catch (e) { setError(e.message); }
  };

  useEffect(() => { fetchClaims(); }, []);

  const updateStatus = async (id, newStatus) => {
    try { await api.put(`/claims/${id}/status`, { status: newStatus }); fetchClaims(); } catch (e) { setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList className="text-blue-600" /> Field Assessment Dashboard
        </h2>
        <p className="text-slate-500 text-sm mt-1">Review pending claims and conduct field assessments.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
      <div className="grid gap-4">
        {claims.length === 0 && <div className="p-8 text-center text-slate-400 bg-white rounded-xl">No pending assessments at this time.</div>}
        {claims.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-bold text-lg text-slate-800">{c.holderName}</h3>
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-bold uppercase">{c.status}</span>
              </div>
              <p className="text-sm text-slate-600 max-w-2xl"><span className="font-semibold">Policy:</span> {c.type} | <span className="font-semibold">Claim Amount:</span> ₹{c.amount?.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">"{c.description}"</p>
            </div>
            
            <div className="flex w-full md:w-auto gap-2">
              {c.status === 'pending' && (
                <button onClick={() => updateStatus(c.id, 'assessing')} className="w-full md:w-auto px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition-colors">
                  Begin Assessment
                </button>
              )}
              {c.status === 'assessing' && (
                <button onClick={() => updateStatus(c.id, 'pending')} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                  <CheckCircle className="w-4 h-4" /> Assessment Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
