import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, money } from '../lib/expertApi';

const METHODS = [
    { id: 'upi', icon: '📱', label: 'experts.pay.upi' },
    { id: 'card', icon: '💳', label: 'experts.pay.card' },
    { id: 'netbanking', icon: '🏦', label: 'experts.pay.netbanking' },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// DEMO checkout window. It looks like a payment step but collects NO card/UPI/bank details
// and moves no money; the backend just records the payment and issues a receipt.
function PaymentModal({ consultation, onPaid, onClose }) {
    const { t } = useTranslation();
    const [method, setMethod] = useState('upi');
    const [step, setStep] = useState('choose');     // choose | processing | success
    const [error, setError] = useState(null);
    const [payment, setPayment] = useState(null);

    const confirm = async () => {
        setStep('processing'); setError(null);
        try {
            const [d] = await Promise.all([
                api(`/api/consultations/${consultation.id}/pay`, { method: 'POST', body: { method } }),
                sleep(1500),                          // short pause so the demo feels like a real payment
            ]);
            setPayment(d.payment);
            setStep('success');
            onPaid(d.consultation);
        } catch (err) {
            setError(err.message || t('experts.pay.failed'));
            setStep('choose');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" data-testid="payment-modal">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 flex items-center justify-between">
                    <h2 className="font-bold">{t('experts.pay.modalTitle')}</h2>
                    <span className="text-[11px] font-bold tracking-wider bg-yellow-300 text-yellow-900 px-2 py-1 rounded">{t('experts.pay.demoBanner')}</span>
                </div>

                <div className="p-6">
                    {step === 'success' ? (
                        <div className="text-center">
                            <div className="text-6xl mb-3">✅</div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{t('experts.pay.success')}</h3>
                            <p className="text-2xl font-bold text-green-600 mb-2">{money(payment.amount)}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t('experts.pay.receiptNo')}: {payment.receipt_no}</p>
                            <div className="flex justify-center gap-3">
                                <Link to={`/receipt/${consultation.id}`} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700">{t('experts.pay.viewReceipt')}</Link>
                                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200">{t('experts.pay.close')}</button>
                            </div>
                        </div>
                    ) : step === 'processing' ? (
                        <div className="text-center py-8">
                            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
                            <p className="text-gray-700 dark:text-gray-200">{t('experts.pay.processing')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-5 rounded-xl bg-green-50 dark:bg-slate-700 p-4">
                                <p className="text-sm text-gray-500 dark:text-gray-300">{consultation.expert_name} · {consultation.topic}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{consultation.minutes_billed} min × {money(consultation.rate_per_minute)}</p>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">{t('experts.pay.amountLabel')}</p>
                                <p className="text-3xl font-bold text-green-600">{money(consultation.amount)}</p>
                            </div>

                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('experts.pay.chooseMethod')}</p>
                            <div className="space-y-2 mb-4">
                                {METHODS.map((m) => (
                                    <label key={m.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer ${method === m.id ? 'border-green-600 bg-green-50 dark:bg-slate-700' : 'border-gray-200 dark:border-slate-600'}`}>
                                        <input type="radio" name="pay-method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                                        <span className="text-xl">{m.icon}</span>
                                        <span className="text-gray-800 dark:text-gray-100">{t(m.label)}</span>
                                    </label>
                                ))}
                            </div>

                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('experts.pay.demoNote')}</p>
                            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200">{t('experts.cancel')}</button>
                                <button type="button" onClick={confirm} className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700">
                                    {t('experts.pay.confirm')} · {money(consultation.amount)}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PaymentModal;
