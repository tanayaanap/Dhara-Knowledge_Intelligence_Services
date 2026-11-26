import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const TOPICS = ['all', 'pmkisan', 'insurance', 'credit', 'msp', 'maharashtra'];

// Vertical news ticker: headlines drift upward and loop forever.
// The list is rendered twice inside one track and the track slides up by exactly one list height
// (-50%), so the restart is seamless. Pauses on hover/focus/touch so links can be clicked, and
// falls back to a plain scrollable list for people who prefer reduced motion.
const TICKER_CSS = `
@keyframes schemes-ticker-up { from { transform: translateY(0); } to { transform: translateY(-50%); } }
.schemes-ticker-view { position: relative; height: 15rem; overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 12%, #000 88%, transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0, #000 12%, #000 88%, transparent 100%); }
.schemes-ticker-track { margin: 0; padding: 0; list-style: none; will-change: transform;
  animation: schemes-ticker-up var(--ticker-duration, 30s) linear infinite; }
.schemes-ticker-view:hover .schemes-ticker-track,
.schemes-ticker-view:focus-within .schemes-ticker-track,
.schemes-ticker-view.is-paused .schemes-ticker-track { animation-play-state: paused; }
.schemes-ticker-view.is-static { height: auto; overflow: visible; -webkit-mask-image: none; mask-image: none; }
.schemes-ticker-view.is-static .schemes-ticker-track { animation: none; }
.schemes-ticker-view.is-static .schemes-ticker-dup { display: none; }
@media (prefers-reduced-motion: reduce) {
  .schemes-ticker-view { overflow-y: auto; -webkit-mask-image: none; mask-image: none; }
  .schemes-ticker-track { animation: none; }
  .schemes-ticker-dup { display: none; }
}`;

function formatDate(iso, lang) {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString(lang, { day: 'numeric', month: 'short' });
}

// Compact "latest scheme news" card for the dashboard.
// Loads in the background; if it fails the rest of the dashboard is unaffected.
function SchemesNewsWidget() {
    const { t, i18n } = useTranslation();
    const [topic, setTopic] = useState('all');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paused, setPaused] = useState(false);
    const resumeTimer = useRef(null);

    const load = useCallback(async (cancelled) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${BACKEND_URL}/api/schemes-news`, {
                params: { topic, language: i18n.language },
                timeout: 45000,
            });
            if (cancelled?.current) return;
            if (res.data.success) setData(res.data);
            else { setData(null); setError(res.data.error || 'unavailable'); }
        } catch (err) {
            if (cancelled?.current) return;
            setData(null);
            setError(err.response?.data?.error || 'unavailable');
        } finally {
            if (!cancelled?.current) setLoading(false);
        }
    }, [topic, i18n.language]);

    useEffect(() => {
        const cancelled = { current: false };
        load(cancelled);
        return () => { cancelled.current = true; };
    }, [load]);

    useEffect(() => () => clearTimeout(resumeTimer.current), []);

    const items = data?.items || [];
    const scrolling = items.length >= 3;          // too few headlines: keep them still
    const pauseTouch = () => { clearTimeout(resumeTimer.current); setPaused(true); };
    const resumeTouch = () => { resumeTimer.current = setTimeout(() => setPaused(false), 3000); };

    const renderItems = (copy) => items.map((item, i) => (
        <li key={`${copy}-${i}`} aria-hidden={copy === 1 ? 'true' : undefined}
            className={`py-3 border-b border-gray-100 dark:border-slate-700${copy === 1 ? ' schemes-ticker-dup' : ''}`}>
            {item.tag && (
                <span className="inline-block mb-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">{item.tag}</span>
            )}
            <a href={item.link} target="_blank" rel="noopener noreferrer" tabIndex={copy === 1 ? -1 : undefined}
               className="block font-medium text-gray-800 dark:text-gray-100 hover:text-green-700 dark:hover:text-green-400">
                {item.title}
            </a>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {[item.source, formatDate(item.date, i18n.language)].filter(Boolean).join(' · ')}
            </p>
        </li>
    ));

    return (
        <section className="max-w-4xl mx-auto mb-12 text-left bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-green-100 dark:border-slate-700" data-testid="schemes-news-widget">
            <style>{TICKER_CSS}</style>
            <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📰</span>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('schemes.title')}</h2>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                {TOPICS.map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setTopic(key)}
                        className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            topic === key
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-green-100'
                        }`}
                    >
                        {t(`schemes.topics.${key}`)}
                    </button>
                ))}
            </div>

            {loading && <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">{t('schemes.loading')}</p>}

            {!loading && error && (
                <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="text-gray-500 dark:text-gray-400">{error}</p>
                    <button type="button" onClick={() => load()} className="shrink-0 text-green-700 dark:text-green-400 font-semibold underline">
                        {t('schemes.retry')}
                    </button>
                </div>
            )}

            {!loading && data && (
                <>
                    {data.translated === false && i18n.language !== 'en' && (
                        <p className="mb-3 text-xs text-yellow-700 dark:text-yellow-300">{t('schemes.untranslated')}</p>
                    )}
                    {data.overview && (
                        <p className="mb-4 text-sm text-gray-700 dark:text-gray-200 bg-green-50 dark:bg-slate-700 rounded-lg p-3">{data.overview}</p>
                    )}
                    {items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t('schemes.empty')}</p>}

                    {items.length > 0 && (
                        <div className={`schemes-ticker-view${scrolling ? '' : ' is-static'}${paused ? ' is-paused' : ''}`}
                             onTouchStart={pauseTouch} onTouchEnd={resumeTouch} onTouchCancel={resumeTouch}
                             data-testid="schemes-ticker">
                            <ul className="schemes-ticker-track" style={{ '--ticker-duration': `${Math.max(20, items.length * 5)}s` }}>
                                {renderItems(0)}
                                {scrolling && renderItems(1)}
                            </ul>
                        </div>
                    )}

                    {items.length > 0 && <p className="mt-3 text-[11px] text-gray-400">{t('schemes.note')}</p>}
                </>
            )}
        </section>
    );
}

export default SchemesNewsWidget;
