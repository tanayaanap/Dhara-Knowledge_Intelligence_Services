import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, money } from '../lib/expertApi';

const PRINT_CSS = `@media print {
  nav, .fixed, .no-print { display: none !important; }
  body { background: #fff !important; }
  .receipt-sheet { box-shadow: none !important; border: 1px solid #ccc; }
}`;

function Row({ label, children }) {
    return (
        <div className="flex justify-between gap-4 py-2 border-b border-gray-100 text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="text-gray-800 text-right font-medium">{children}</span>
        </div>
    );
}

function Receipt() {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const [r, setR] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        api(`/api/consultations/${id}/receipt`).then((d) => setR(d.receipt)).catch((e) => setError(e.message));
    }, [id]);

    const when = (iso) => (iso ? new Date(iso).toLocaleString(i18n.language) : '');

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-slate-900 dark:to-slate-800 py-10">
            <style>{PRINT_CSS}</style>
            <div className="container mx-auto px-6 max-w-xl">
                {error && <p className="text-center text-red-600">{error}</p>}
                {!error && !r && <p className="text-center text-gray-500 animate-pulse">{t('experts.loading')}</p>}

                {r && (
                    <>
                        <div className="receipt-sheet bg-white rounded-2xl shadow-xl p-8" data-testid="receipt">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-green-700">DharaAI</h1>
                                    <p className="text-sm text-gray-500">{t('experts.pay.receiptTitle')}</p>
                                </div>
                                <span className="text-[11px] font-bold tracking-wider bg-yellow-300 text-yellow-900 px-2 py-1 rounded">{t('experts.pay.demoBanner')}</span>
                            </div>

                            <Row label={t('experts.pay.receiptNo')}>{r.receipt_no}</Row>
                            <Row label={t('experts.pay.reference')}>{r.reference}</Row>
                            <Row label={t('experts.pay.paidOn')}>{when(r.paid_at)}</Row>
                            <Row label={t('experts.pay.method')}>{t(`experts.pay.${r.method}`)}</Row>
                            <Row label={t('experts.pay.farmer')}>{r.farmer_name}</Row>
                            <Row label={t('experts.pay.expert')}>{r.expert_name}{r.expert_qualification ? ` (${r.expert_qualification})` : ''}</Row>
                            <Row label={t('experts.pay.topic')}>{r.topic}</Row>
                            <Row label={t('experts.pay.session')}>{when(r.started_at)} → {when(r.ended_at)}</Row>
                            <Row label={t('experts.pay.minutes')}>{r.minutes_billed} × {money(r.rate_per_minute)}</Row>

                            <div className="flex justify-between items-center mt-5 pt-4 border-t-2 border-gray-200">
                                <span className="font-semibold text-gray-700">{t('experts.pay.total')}</span>
                                <span className="text-3xl font-bold text-green-700">{money(r.amount)}</span>
                            </div>
                            <p className="mt-6 text-xs text-gray-400">{t('experts.pay.demoNote')}</p>
                        </div>

                        <div className="no-print mt-6 flex flex-wrap justify-center gap-3">
                            <button type="button" onClick={() => window.print()} className="bg-green-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-700">{t('experts.pay.print')}</button>
                            <Link to={`/consultation/${id}`} className="px-5 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200">{t('experts.pay.backToChat')}</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Receipt;
