import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, money, STATUS_STYLE } from '../lib/expertApi';

function MyConsultations() {
    const { t } = useTranslation();
    const [items, setItems] = useState(null);
    const [needLogin, setNeedLogin] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let stop = false;
        const load = async () => {
            try {
                const d = await api('/api/my-consultations');
                if (!stop) { setItems(d.consultations); setError(null); }
            } catch (err) {
                if (stop) return;
                if (err.status === 401) setNeedLogin(true); else setError(err.message);
            }
        };
        load();
        const h = setInterval(load, 10000);
        return () => { stop = true; clearInterval(h); };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-slate-900 dark:to-slate-800 py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('experts.mine.title')}</h1>
                        <Link to="/experts" className="text-green-700 dark:text-green-400 font-semibold underline">{t('experts.mine.browse')}</Link>
                    </div>

                    {needLogin && (
                        <p className="text-red-600">{t('experts.loginNeeded')} <Link to="/login" className="underline font-semibold">{t('experts.login')}</Link></p>
                    )}
                    {error && <p className="text-red-600">{error}</p>}
                    {items && items.length === 0 && <p className="text-gray-500">{t('experts.mine.empty')}</p>}

                    <div className="space-y-4">
                        {(items || []).map((c) => (
                            <Link key={c.id} to={`/consultation/${c.id}`}
                                className="block bg-white dark:bg-slate-800 rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-white">{c.topic}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('experts.mine.withExpert', { name: c.expert_name })}</p>
                                    </div>
                                    <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[c.status] || ''}`}>
                                        {t(`experts.status.${c.status}`)}
                                    </span>
                                </div>
                                {c.status === 'completed' && (
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                        {t('experts.room.summaryMinutes')}: {c.minutes_billed} · {t('experts.room.summaryAmount')}: <strong>{money(c.amount)}</strong>
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MyConsultations;
