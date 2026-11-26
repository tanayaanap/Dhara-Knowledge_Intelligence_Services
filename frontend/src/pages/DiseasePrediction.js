import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SEVERITY_STYLE = {
    none: 'bg-green-100 text-green-700',
    low: 'bg-yellow-100 text-yellow-700',
    medium: 'bg-orange-100 text-orange-700',
    high: 'bg-red-100 text-red-700',
};

function InfoList({ title, items }) {
    if (!items || items.length === 0) return null;
    return (
        <div className="mb-5">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">{title}</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-200">
                {items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
        </div>
    );
}

function DiseasePrediction() {
    const { t, i18n } = useTranslation();
    const [info, setInfo] = useState(null);
    const [infoLoading, setInfoLoading] = useState(false);
    const [infoError, setInfoError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setResult(null); setInfo(null); setInfoError(null);
        setError(null);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setResult(null); setInfo(null); setInfoError(null);
        setError(null);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setError('Please select a leaf image first.');
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('image', selectedFile);

            const response = await axios.post(`${BACKEND_URL}/api/predict-disease`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to get prediction. Please try again.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: ask Gemini to explain the predicted disease in the selected language.
    // Re-runs automatically if the user switches language after a prediction.
    const fetchInfo = async (cancelledRef) => {
        if (!result?.raw_class) return;
        setInfoLoading(true);
        setInfoError(null);
        try {
            const response = await axios.post(`${BACKEND_URL}/api/disease-info`, {
                raw_class: result.raw_class,
                language: i18n.language,
            });
            if (cancelledRef?.current) return;
            if (response.data.success) {
                setInfo(response.data.info);
            } else {
                setInfo(null);
                setInfoError(response.data.error || 'unavailable');
            }
        } catch (err) {
            if (cancelledRef?.current) return;
            setInfo(null);
            setInfoError(err.response?.data?.error || 'unavailable');
        } finally {
            if (!cancelledRef?.current) setInfoLoading(false);
        }
    };

    useEffect(() => {
        const cancelled = { current: false };
        fetchInfo(cancelled);
        return () => { cancelled.current = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result?.raw_class, i18n.language]);

    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setResult(null); setInfo(null); setInfoError(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 py-12">
        <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
                <span className="text-5xl">🔬</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
                Disease Prediction
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                Upload a leaf photo and let AI identify the disease
                </p>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mb-8">
                <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-100 mb-3">
                    🌿 Upload Leaf Image
                    </label>

                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-blue-400 rounded-xl p-8 text-center cursor-pointer transition-all bg-gray-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-slate-700"
                        data-testid="disease-upload-zone"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                            onChange={handleFileChange}
                            className="hidden"
                            data-testid="disease-image-input"
                        />

                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Selected leaf"
                                className="max-h-64 mx-auto rounded-lg shadow-md"
                            />
                        ) : (
                            <>
                                <div className="text-4xl mb-3">🗂️</div>
                                <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">Click to upload or drag &amp; drop</p>
                                <p className="text-xs text-gray-400 dark:text-gray-400">PNG, JPG, or WEBP</p>
                            </>
                        )}
                    </div>

                    {selectedFile && (
                        <div className="flex items-center justify-between mt-3 text-sm text-gray-600 dark:text-gray-300">
                            <span>{selectedFile.name}</span>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="text-red-500 hover:text-red-700 font-medium"
                            >
                                Remove
                            </button>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading || !selectedFile}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-600 hover:to-cyan-700 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    data-testid="predict-disease-button"
                >
                    {loading ? (
                    <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Analyzing...
                    </span>
                    ) : (
                    'Predict Disease'
                    )}
                </button>
                </form>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded" data-testid="error-message">
                <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-xl p-8 animate-fade-in" data-testid="disease-result">
                <div className="text-center mb-8">
                    <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-4">
                    <span className="text-6xl">{result.disease === 'Healthy' ? '✅' : '⚠️'}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Diagnosis Result</h2>
                    <div className="inline-block bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    {result.confidence}% Confidence
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Plant</h3>
                    <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4" data-testid="detected-plant">{result.plant}</p>

                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Detected Condition</h3>
                    <p className="text-4xl font-bold text-blue-600" data-testid="detected-disease">{result.disease}</p>
                </div>

                {/* Gemini disease details (translated) */}
                <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md" data-testid="disease-info">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t('disease.aboutDisease')}</h3>

                    {infoLoading && (
                        <p className="text-gray-500 dark:text-gray-400 animate-pulse">{t('disease.loadingInfo')}</p>
                    )}

                    {!infoLoading && infoError && (
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-red-600">{infoError}</p>
                            <button
                                type="button"
                                onClick={() => fetchInfo()}
                                className="shrink-0 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600"
                            >
                                {t('disease.retry')}
                            </button>
                        </div>
                    )}

                    {!infoLoading && info && (
                        <>
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                {info.disease_name && (
                                    <span className="text-xl font-semibold text-gray-800 dark:text-gray-100">{info.disease_name}</span>
                                )}
                                {info.severity !== 'none' && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${SEVERITY_STYLE[info.severity] || SEVERITY_STYLE.medium}`}>
                                        {t('disease.severity')}: {info.severity_label || info.severity}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-700 dark:text-gray-200 mb-5">{info.summary}</p>
                            <InfoList title={t('disease.symptoms')} items={info.symptoms} />
                            <InfoList title={t('disease.causes')} items={info.causes} />
                            <InfoList title={t('disease.treatment')} items={info.treatment} />
                            <InfoList title={t('disease.prevention')} items={info.prevention} />
                            {info.when_to_consult && (
                                <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-slate-700">
                                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-300 mb-1">{t('disease.consult')}</h4>
                                    <p className="text-gray-700 dark:text-gray-200">{info.when_to_consult}</p>
                                </div>
                            )}
                            <p className="text-xs text-gray-400">{t('disease.aiNote')}</p>
                        </>
                    )}
                </div>
                </div>
            )}
            </div>
        </div>
        </div>
    );
}

export default DiseasePrediction;