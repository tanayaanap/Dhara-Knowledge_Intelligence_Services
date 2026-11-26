import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, money, STATUS_STYLE } from '../lib/expertApi';

const LIVE = ['requested', 'accepted', 'active'];

function formatClock(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// Used by BOTH the farmer and the expert; the server decides which role you are.
function ConsultationRoom() {
    const { id } = useParams();
    const { t } = useTranslation();
    const [c, setC] = useState(null);
    const [msgs, setMsgs] = useState([]);
    const [error, setError] = useState(null);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [, setTick] = useState(0);
    const lastId = useRef(0);
    const polledAt = useRef(Date.now());
    const bottomRef = useRef(null);

    const poll = useCallback(async () => {
        try {
            const d = await api(`/api/consultations/${id}/poll?after=${lastId.current}`);
            polledAt.current = Date.now();
            setC(d.consultation);
            if (d.messages.length) {
                lastId.current = d.messages[d.messages.length - 1].id;
                setMsgs((m) => [...m, ...d.messages]);
            }
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    }, [id]);

    useEffect(() => { poll(); }, [poll]);

    const live = c && LIVE.includes(c.status);
    useEffect(() => {
        if (!live) return undefined;
        const h = setInterval(poll, 3000);
        return () => clearInterval(h);
    }, [live, poll]);

    // local 1-second ticker for the running timer
    useEffect(() => {
        if (!c || c.status !== 'active') return undefined;
        const h = setInterval(() => setTick((x) => x + 1), 1000);
        return () => clearInterval(h);
    }, [c]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);

    const act = async (action) => {
        setBusy(true);
        try {
            const d = await api(`/api/consultations/${id}/action`, { method: 'POST', body: { action } });
            setC(d.consultation);
            polledAt.current = Date.now();
            setError(null);
        } catch (err) { setError(err.message); }
        finally { setBusy(false); }
    };

    const send = async (ev) => {
        ev.preventDefault();
        const body = text.trim();
        if (!body) return;
        setText('');
        try {
            await api(`/api/consultations/${id}/messages`, { method: 'POST', body: { text: body } });
            await poll();
        } catch (err) { setError(err.message); setText(body); }
    };

    if (!c) {
        return (
            <div className="min-h-screen py-12 text-center text-gray-500">
                {error ? <p className="text-red-600">{error}</p> : <p className="animate-pulse">{t('experts.loading')}</p>}
            </div>
        );
    }

    const isFarmer = c.role === 'farmer';
    const other = isFarmer ? c.expert_name : c.farmer_name;
    const elapsed = c.status === 'active' ? (c.elapsed_seconds || 0) + (Date.now() - polledAt.current) / 1000 : 0;
    const costNow = Math.max(1, Math.ceil(elapsed / 60)) * c.rate_per_minute;
    const back = isFarmer ? '/my-consultations' : '/expert';
    const btn = 'px-4 py-2 rounded-lg font-medium disabled:opacity-50';

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-slate-900 dark:to-slate-800 py-8">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto">
                    <Link to={back} className="text-sm text-green-700 dark:text-green-400 underline">← {t('experts.room.back')}</Link>

                    <div className="mt-3 bg-white dark:bg-slate-800 rounded-2xl shadow-md p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h1 className="text-xl font-bold text-gray-800 dark:text-white">{c.topic}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{other}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[c.status] || ''}`}>{t(`experts.status.${c.status}`)}</span>
                        </div>

                        {c.status === 'active' && (
                            <div className="mt-4 flex flex-wrap gap-6 text-sm">
                                <div><span className="text-gray-500">{t('experts.room.timer')}</span><div className="text-2xl font-mono font-bold text-gray-800 dark:text-white">{formatClock(elapsed)}</div></div>
                                <div><span className="text-gray-500">{t('experts.room.cost')}</span><div className="text-2xl font-bold text-green-600">{money(costNow)}</div></div>
                                <p className="text-xs text-gray-500 self-end">{t('experts.room.idleNote', { min: c.idle_limit_minutes })}</p>
                            </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                            {!isFarmer && c.status === 'requested' && (<>
                                <button disabled={busy} onClick={() => act('accept')} className={`${btn} bg-green-600 text-white hover:bg-green-700`}>{t('experts.room.accept')}</button>
                                <button disabled={busy} onClick={() => act('decline')} className={`${btn} border border-red-400 text-red-600`}>{t('experts.room.decline')}</button>
                            </>)}
                            {isFarmer && c.status === 'accepted' && (
                                <button disabled={busy} onClick={() => act('start')} className={`${btn} bg-green-600 text-white hover:bg-green-700`}>{t('experts.room.start')}</button>
                            )}
                            {c.status === 'active' && (
                                <button disabled={busy} onClick={() => act('end')} className={`${btn} bg-red-600 text-white hover:bg-red-700`}>{t('experts.room.end')}</button>
                            )}
                            {(c.status === 'requested' || c.status === 'accepted') && (isFarmer || c.status === 'accepted') && (
                                <button disabled={busy} onClick={() => act('cancel')} className={`${btn} border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200`}>{t('experts.room.cancelRequest')}</button>
                            )}
                        </div>

                        {isFarmer && c.status === 'requested' && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t('experts.room.waitingExpert')}</p>}
                        {isFarmer && c.status === 'accepted' && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t('experts.room.acceptedHelp', { rate: c.rate_per_minute })}</p>}
                        {!isFarmer && c.status === 'accepted' && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t('experts.room.waitingFarmer')}</p>}
                        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                    </div>

                    {c.status === 'completed' && (
                        <div className="mt-4 bg-green-50 dark:bg-slate-700 border border-green-200 dark:border-slate-600 rounded-2xl p-5">
                            <div className="flex flex-wrap gap-8">
                                <div><div className="text-sm text-gray-500">{t('experts.room.summaryMinutes')}</div><div className="text-2xl font-bold text-gray-800 dark:text-white">{c.minutes_billed}</div></div>
                                <div><div className="text-sm text-gray-500">{t('experts.room.summaryAmount')}</div><div className="text-2xl font-bold text-green-600">{money(c.amount)}</div></div>
                            </div>
                            {(c.ended_by === 'idle' || c.ended_by === 'limit') && (
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t(c.ended_by === 'idle' ? 'experts.room.endedIdle' : 'experts.room.endedLimit')}</p>
                            )}
                            <p className="mt-2 text-xs text-gray-500">{t('experts.room.paymentNote')}</p>
                        </div>
                    )}

                    <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl shadow-md p-4">
                        <div className="h-96 overflow-y-auto space-y-3 pr-1" data-testid="chat-log">
                            <div className="flex justify-start">
                                <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-yellow-50 dark:bg-slate-700 text-sm text-gray-700 dark:text-gray-200">
                                    <div className="text-xs font-semibold text-gray-500 mb-1">{t('experts.room.originalRequest')}</div>
                                    {c.message}
                                </div>
                            </div>
                            {msgs.map((m) => {
                                const mine = m.sender === c.role;
                                return (
                                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words ${mine ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-100'}`}>
                                            {m.text}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>

                        <form onSubmit={send} className="mt-3 flex gap-2">
                            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000}
                                disabled={c.status !== 'active'} placeholder={t('experts.room.typeMessage')}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white disabled:opacity-50" />
                            <button type="submit" disabled={c.status !== 'active' || !text.trim()} className={`${btn} bg-green-600 text-white hover:bg-green-700`}>{t('experts.room.sendMsg')}</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ConsultationRoom;
