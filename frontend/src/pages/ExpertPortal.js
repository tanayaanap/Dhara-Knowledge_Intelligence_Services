import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money, STATUS_STYLE } from '../lib/expertApi';

const input = 'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white';
const label = 'block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1';

function toggleIn(list, value) {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

function AuthForms({ onLoggedIn }) {
    const [mode, setMode] = useState('login');
    const [meta, setMeta] = useState({ expertise: [], languages: [], min_rate: 1, max_rate: 500 });
    const [f, setF] = useState({ name: '', email: '', password: '', phone: '', qualification: '', experience_years: '', rate_per_minute: '', location: '', bio: '', expertise: [], languages: [] });
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

    useEffect(() => { api('/api/experts/meta').then(setMeta).catch(() => {}); }, []);

    const submit = async (ev) => {
        ev.preventDefault();
        setBusy(true); setError(null); setInfo(null);
        try {
            if (mode === 'login') {
                const d = await api('/api/expert/login', { method: 'POST', body: { email: f.email, password: f.password } });
                onLoggedIn(d.expert);
            } else {
                const d = await api('/api/expert/register', { method: 'POST', body: f });
                setInfo(d.message);
                setMode('login');
            }
        } catch (err) { setError(err.message); }
        finally { setBusy(false); }
    };

    return (
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
            <div className="flex mb-6 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600">
                {['login', 'register'].map((m) => (
                    <button key={m} type="button" onClick={() => { setMode(m); setError(null); }}
                        className={`flex-1 py-2 font-medium ${mode === m ? 'bg-green-600 text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                        {m === 'login' ? 'Expert login' : 'Register as expert'}
                    </button>
                ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
                {mode === 'register' && (<>
                    <div><label className={label}>Full name</label><input className={input} value={f.name} onChange={set('name')} required /></div>
                </>)}
                <div><label className={label}>Email</label><input type="email" className={input} value={f.email} onChange={set('email')} required /></div>
                <div><label className={label}>Password {mode === 'register' && '(min 8 characters)'}</label><input type="password" className={input} value={f.password} onChange={set('password')} required /></div>

                {mode === 'register' && (<>
                    <div><label className={label}>Phone (for verification only, never shown to farmers)</label><input className={input} value={f.phone} onChange={set('phone')} required /></div>
                    <div><label className={label}>Qualification</label><input className={input} placeholder="e.g. M.Sc. Agronomy" value={f.qualification} onChange={set('qualification')} required /></div>
                    <div>
                        <label className={label}>Areas of expertise (choose 1 to 5)</label>
                        <div className="flex flex-wrap gap-2">
                            {meta.expertise.map((a) => (
                                <button key={a} type="button" onClick={() => setF({ ...f, expertise: toggleIn(f.expertise, a) })}
                                    className={`px-3 py-1 rounded-full text-sm border ${f.expertise.includes(a) ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200'}`}>{a}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className={label}>Languages you can consult in</label>
                        <div className="flex flex-wrap gap-2">
                            {meta.languages.map((l) => (
                                <button key={l} type="button" onClick={() => setF({ ...f, languages: toggleIn(f.languages, l) })}
                                    className={`px-3 py-1 rounded-full text-sm border ${f.languages.includes(l) ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200'}`}>{l}</button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className={label}>Experience (years)</label><input type="number" min="0" max="60" className={input} value={f.experience_years} onChange={set('experience_years')} required /></div>
                        <div><label className={label}>Charge per minute (₹{meta.min_rate}-{meta.max_rate})</label><input type="number" min={meta.min_rate} max={meta.max_rate} step="0.5" className={input} value={f.rate_per_minute} onChange={set('rate_per_minute')} required /></div>
                    </div>
                    <div><label className={label}>Location</label><input className={input} value={f.location} onChange={set('location')} /></div>
                    <div><label className={label}>About you (max 600 characters)</label><textarea rows={3} maxLength={600} className={input} value={f.bio} onChange={set('bio')} /></div>
                    <p className="text-xs text-gray-500">An admin reviews every profile. You will appear to farmers only after approval.</p>
                </>)}

                {info && <p className="text-green-700 text-sm">{info} You can log in now to check your status.</p>}
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button type="submit" disabled={busy} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
                    {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Submit for approval'}
                </button>
            </form>
        </div>
    );
}

function Dashboard({ expert, setExpert, onLogout }) {
    const [items, setItems] = useState([]);
    const [rate, setRate] = useState(expert.rate_per_minute);
    const [bio, setBio] = useState(expert.bio || '');
    const [msg, setMsg] = useState(null);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        try { const d = await api('/api/expert/consultations'); setItems(d.consultations); } catch (e) { /* ignore transient */ }
    }, []);
    useEffect(() => { load(); const h = setInterval(load, 8000); return () => clearInterval(h); }, [load]);

    const save = async (patch, okMsg) => {
        setError(null); setMsg(null);
        try {
            const d = await api('/api/expert/me', { method: 'PUT', body: patch });
            setExpert(d.expert); setMsg(okMsg);
        } catch (err) { setError(err.message); }
    };

    const respond = async (id, action) => {
        try { await api(`/api/consultations/${id}/action`, { method: 'POST', body: { action } }); load(); }
        catch (err) { setError(err.message); }
    };

    const approved = expert.status === 'approved';
    const completed = items.filter((c) => c.status === 'completed');
    const earned = completed.filter((c) => c.payment?.paid).reduce((sum, c) => sum + c.amount, 0);
    const pending = completed.filter((c) => !c.payment?.paid).reduce((sum, c) => sum + c.amount, 0);
    const requests = items.filter((c) => c.status === 'requested');
    const running = items.filter((c) => c.status === 'accepted' || c.status === 'active');
    const history = items.filter((c) => ['completed', 'declined', 'cancelled'].includes(c.status));

    const banner = {
        pending: ['bg-yellow-50 border-yellow-300 text-yellow-800', 'Your profile is under review. Farmers will see you once an admin approves it.'],
        rejected: ['bg-red-50 border-red-300 text-red-700', `Your profile was not approved.${expert.review_note ? ' Reason: ' + expert.review_note : ''}`],
        approved: ['bg-green-50 border-green-300 text-green-800', 'Approved. Farmers can see your profile and request consultations.'],
    }[expert.status];

    const Row = ({ c, actions }) => (
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-gray-100 dark:border-slate-700 last:border-0">
            <div>
                <p className="font-semibold text-gray-800 dark:text-white">{c.topic}</p>
                <p className="text-sm text-gray-500">{c.farmer_name} · {money(c.rate_per_minute)}/min{c.status === 'completed' ? ` · ${c.minutes_billed} min · ${money(c.amount)} · ${c.payment?.paid ? 'paid' : 'awaiting payment'}` : ''}</p>
            </div>
            <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[c.status]}`}>{c.status}</span>
                {actions}
                <Link to={`/consultation/${c.id}`} className="text-green-700 dark:text-green-400 underline text-sm">Open</Link>
            </div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className={`border rounded-xl p-4 ${banner[0]}`}>{banner[1]}</div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{expert.name}</h2>
                        <p className="text-sm text-gray-500">{expert.qualification}</p>
                        <p className="text-sm text-gray-500">{expert.expertise.join(', ')} · {expert.experience_years} yrs</p>
                    </div>
                    <button onClick={onLogout} className="text-sm text-gray-600 dark:text-gray-300 underline">Log out</button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-5">
                    <div>
                        <label className={label}>Charge per minute (₹)</label>
                        <div className="flex gap-2">
                            <input type="number" step="0.5" className={input} value={rate} onChange={(e) => setRate(e.target.value)} />
                            <button onClick={() => save({ rate_per_minute: rate }, 'Rate updated (applies to new requests).')} className="px-4 rounded-lg bg-green-600 text-white">Save</button>
                        </div>
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                            <input type="checkbox" checked={expert.available} onChange={(e) => save({ available: e.target.checked }, e.target.checked ? 'You are now available.' : 'You are now unavailable.')} />
                            Available for new consultations
                        </label>
                    </div>
                </div>
                <div className="mt-4">
                    <label className={label}>About you</label>
                    <textarea rows={3} maxLength={600} className={input} value={bio} onChange={(e) => setBio(e.target.value)} />
                    <button onClick={() => save({ bio }, 'Bio updated.')} className="mt-2 px-4 py-2 rounded-lg bg-green-600 text-white">Save bio</button>
                </div>
                {msg && <p className="mt-3 text-sm text-green-700">{msg}</p>}
                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                <p className="mt-4 text-xs text-gray-500">Paid: <strong>{money(earned)}</strong> · Awaiting payment: <strong>{money(pending)}</strong> (demo payments, no real money moves).</p>
            </div>

            {approved && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-2">New requests ({requests.length})</h3>
                    {requests.length === 0 && <p className="text-sm text-gray-500">No pending requests.</p>}
                    {requests.map((c) => (
                        <Row key={c.id} c={c} actions={<>
                            <button onClick={() => respond(c.id, 'accept')} className="px-3 py-1 rounded-lg bg-green-600 text-white text-sm">Accept</button>
                            <button onClick={() => respond(c.id, 'decline')} className="px-3 py-1 rounded-lg border border-red-400 text-red-600 text-sm">Decline</button>
                        </>} />
                    ))}

                    <h3 className="font-bold text-gray-800 dark:text-white mt-6 mb-2">In progress ({running.length})</h3>
                    {running.length === 0 && <p className="text-sm text-gray-500">Nothing in progress.</p>}
                    {running.map((c) => <Row key={c.id} c={c} />)}

                    <h3 className="font-bold text-gray-800 dark:text-white mt-6 mb-2">History</h3>
                    {history.length === 0 && <p className="text-sm text-gray-500">No past consultations yet.</p>}
                    {history.map((c) => <Row key={c.id} c={c} />)}
                </div>
            )}
        </div>
    );
}

function ExpertPortal() {
    const [expert, setExpert] = useState(undefined); // undefined = loading, null = logged out

    useEffect(() => {
        api('/api/expert/me').then((d) => setExpert(d.authenticated ? d.expert : null)).catch(() => setExpert(null));
    }, []);

    const logout = async () => { try { await api('/api/expert/logout', { method: 'POST' }); } catch (e) { /* ignore */ } setExpert(null); };

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-slate-900 dark:to-slate-800 py-12">
            <div className="container mx-auto px-6">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Expert portal</h1>
                    <p className="text-gray-600 dark:text-gray-300">Offer paid-by-the-minute consultations to farmers.</p>
                    <Link to="/experts" className="text-sm text-green-700 dark:text-green-400 underline">← Back to farmer view</Link>
                </div>
                {expert === undefined && <p className="text-center text-gray-500 animate-pulse">Loading...</p>}
                {expert === null && <AuthForms onLoggedIn={setExpert} />}
                {expert && <Dashboard expert={expert} setExpert={setExpert} onLogout={logout} />}
            </div>
        </div>
    );
}

export default ExpertPortal;
