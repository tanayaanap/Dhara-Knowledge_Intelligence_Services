import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, areaSlug } from '../lib/expertApi';

function ExpertCard({ e, onRequest, t }) {
    return (
        <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 flex flex-col" data-testid="expert-card">
            <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{e.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{e.qualification}</p>
                </div>
                <span className="shrink-0 text-lg font-bold text-green-600">{t('experts.perMinute', { rate: e.rate_per_minute })}</span>
            </div>

            <div className="flex flex-wrap gap-2 my-3">
                {e.expertise.map((a) => (
                    <span key={a} className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        {t(`experts.areas.${areaSlug(a)}`, { defaultValue: a })}
                    </span>
                ))}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 flex-1">{e.bio}</p>

            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                <p>{t('experts.years', { years: e.experience_years })}{e.location ? ` · ${e.location}` : ''}</p>
                <p>{t('experts.speaks')}: {e.languages.join(', ')}</p>
            </div>

            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${e.available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                        {e.available ? t('experts.available') : t('experts.unavailable')}
                    </span>
                    {e.is_demo && <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">{t('experts.demo')}</span>}
                </div>
                <button
                    type="button"
                    disabled={!e.available}
                    onClick={() => onRequest(e)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t('experts.request')}
                </button>
            </div>
        </article>
    );
}

function RequestModal({ expert, onClose, t }) {
    const [topic, setTopic] = useState('');
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [needLogin, setNeedLogin] = useState(false);
    const [sent, setSent] = useState(false);

    const submit = async (ev) => {
        ev.preventDefault();
        setBusy(true); setError(null); setNeedLogin(false);
        try {
            await api('/api/consultations', { method: 'POST', body: { expert_id: expert.id, topic, message } });
            setSent(true);
        } catch (err) {
            if (err.status === 401) setNeedLogin(true); else setError(err.message);
        } finally { setBusy(false); }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6">
                {sent ? (
                    <div className="text-center">
                        <div className="text-5xl mb-3">✅</div>
                        <p className="text-gray-800 dark:text-white font-semibold mb-4">{t('experts.requestSent')}</p>
                        <Link to="/my-consultations" className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg font-medium mr-2">{t('experts.viewMine')}</Link>
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200">{t('experts.close')}</button>
                    </div>
                ) : (
                    <form onSubmit={submit}>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t('experts.requestTitle', { name: expert.name })}</h2>

                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">{t('experts.topic')}</label>
                        <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={120} required
                            placeholder={t('experts.topicHint')}
                            className="w-full mb-4 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />

                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">{t('experts.message')}</label>
                        <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} required rows={4}
                            className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />

                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('experts.billingNote', { rate: expert.rate_per_minute })}</p>

                        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
                        {needLogin && (
                            <p className="text-sm mb-3 text-red-600">
                                {t('experts.loginNeeded')} <Link to="/login" className="underline font-semibold">{t('experts.login')}</Link>
                            </p>
                        )}

                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200">{t('experts.cancel')}</button>
                            <button type="submit" disabled={busy} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                                {busy ? t('experts.sending') : t('experts.send')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function ExpertDirectory() {
    const { t } = useTranslation();
    const [meta, setMeta] = useState({ expertise: [], languages: [] });
    const [experts, setExperts] = useState(null);
    const [error, setError] = useState(null);
    const [q, setQ] = useState('');
    const [expertise, setExpertise] = useState('');
    const [language, setLanguage] = useState('');
    const [availableOnly, setAvailableOnly] = useState(false);
    const [selected, setSelected] = useState(null);

    useEffect(() => { api('/api/experts/meta').then(setMeta).catch(() => {}); }, []);

    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const params = new URLSearchParams();
                if (q.trim()) params.set('q', q.trim());
                if (expertise) params.set('expertise', expertise);
                if (language) params.set('language', language);
                if (availableOnly) params.set('available', '1');
                const d = await api(`/api/experts?${params.toString()}`);
                if (!cancelled) { setExperts(d.experts); setError(null); }
            } catch (err) {
                if (!cancelled) setError(t('experts.loadError'));
            }
        }, 250);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [q, expertise, language, availableOnly, t]);

    const field = 'px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white';

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-slate-900 dark:to-slate-800 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-block p-4 bg-green-100 rounded-full mb-4"><span className="text-5xl">👩‍🌾</span></div>
                        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-3">{t('experts.title')}</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300">{t('experts.subtitle')}</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
                            <Link to="/my-consultations" className="text-green-700 dark:text-green-400 font-semibold underline">{t('experts.viewMine')}</Link>
                            <Link to="/expert" className="text-gray-600 dark:text-gray-300 underline">{t('experts.areExpert')}</Link>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-8 justify-center">
                        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('experts.search')} className={`${field} w-full sm:w-72`} />
                        <select value={expertise} onChange={(e) => setExpertise(e.target.value)} className={field}>
                            <option value="">{t('experts.allExpertise')}</option>
                            {meta.expertise.map((a) => <option key={a} value={a}>{t(`experts.areas.${areaSlug(a)}`, { defaultValue: a })}</option>)}
                        </select>
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} className={field}>
                            <option value="">{t('experts.allLanguages')}</option>
                            {meta.languages.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
                            {t('experts.availableOnly')}
                        </label>
                    </div>

                    {error && <p className="text-center text-red-600">{error}</p>}
                    {!error && experts === null && <p className="text-center text-gray-500 animate-pulse">{t('experts.loading')}</p>}
                    {experts && experts.length === 0 && <p className="text-center text-gray-500">{t('experts.noResults')}</p>}

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {(experts || []).map((e) => <ExpertCard key={e.id} e={e} t={t} onRequest={setSelected} />)}
                    </div>
                </div>
            </div>
            {selected && <RequestModal expert={selected} t={t} onClose={() => setSelected(null)} />}
        </div>
    );
}

export default ExpertDirectory;
