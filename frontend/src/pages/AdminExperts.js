import React, { useState } from 'react';
import { api } from '../lib/expertApi';

// Admin key is kept in memory only (never stored in the browser).
function AdminExperts() {
    const [key, setKey] = useState('');
    const [status, setStatus] = useState('pending');
    const [rows, setRows] = useState(null);
    const [error, setError] = useState(null);

    const load = async (s = status) => {
        setError(null);
        try {
            const d = await api(`/api/admin/experts?status=${s}`, { headers: { 'X-Admin-Key': key } });
            setRows(d.experts);
        } catch (err) { setRows(null); setError(err.message); }
    };

    const review = async (id, action) => {
        const note = action === 'reject' ? (window.prompt('Reason for rejection (shown to the expert):') || '') : '';
        try {
            await api(`/api/admin/experts/${id}/review`, { method: 'POST', body: { action, note }, headers: { 'X-Admin-Key': key } });
            load();
        } catch (err) { setError(err.message); }
    };

    const field = 'px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white';

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-slate-900 dark:to-slate-800 py-12">
            <div className="container mx-auto px-6 max-w-4xl">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Admin: review experts</h1>

                <div className="flex flex-wrap gap-3 mb-6">
                    <input type="password" placeholder="Admin key" value={key} onChange={(e) => setKey(e.target.value)} className={`${field} w-64`} />
                    <select value={status} onChange={(e) => { setStatus(e.target.value); if (key) load(e.target.value); }} className={field}>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="all">All</option>
                    </select>
                    <button onClick={() => load()} className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium">Load</button>
                </div>

                {error && <p className="text-red-600 mb-4">{error}</p>}
                {rows && rows.length === 0 && <p className="text-gray-500">No experts in this list.</p>}

                <div className="space-y-4">
                    {(rows || []).map((e) => (
                        <div key={e.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">{e.name} {e.is_demo && <span className="text-xs text-purple-600">(demo)</span>}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{e.qualification} · {e.experience_years} yrs · ₹{e.rate_per_minute}/min</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{e.expertise.join(', ')} · {e.languages.join(', ')}</p>
                                    <p className="text-sm text-gray-500">{e.email} · {e.phone} · {e.location}</p>
                                    {e.bio && <p className="text-sm text-gray-500 mt-1">{e.bio}</p>}
                                    {e.review_note && <p className="text-sm text-red-600 mt-1">Note: {e.review_note}</p>}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{e.status}</span>
                                    <div className="flex gap-2">
                                        {e.status !== 'approved' && <button onClick={() => review(e.id, 'approve')} className="px-3 py-1 rounded-lg bg-green-600 text-white text-sm">Approve</button>}
                                        {e.status !== 'rejected' && <button onClick={() => review(e.id, 'reject')} className="px-3 py-1 rounded-lg border border-red-400 text-red-600 text-sm">Reject</button>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AdminExperts;
