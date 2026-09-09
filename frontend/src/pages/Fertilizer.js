import React, { useState } from 'react'
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Fertilizer() {
    const [formData, setFormData] = useState({
        crop_type: '',
        soil_type: '',
        nitrogen: '',
        phosphorous: '',
        potassium: '',
        temperature: '',
        moisture: '',
        rainfall: '',
        ph: '',
        carbon: ''
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const cropTypes = ['Adzuki Beans', 'Black gram', 'Chickpea', 'Coconut', 'Coffee', 'Cotton', 'Ground Nut', 'Jute', 'Kidney Beans', 'Lentil', 'Moth Beans', 'Mung Bean', 'Peas', 'Pigeon Peas', 'Rubber', 'Sugarcane', 'Tea', 'Tobacco', 'apple', 'banana', 'grapes', 'maize', 'mango', 'millet', 'muskmelon', 'orange', 'papaya', 'pomegranate', 'rice', 'watermelon', 'wheat'];
    const soilTypes = ['Acidic Soil', 'Alkaline Soil', 'Loamy Soil', 'Neutral Soil', 'Peaty Soil'];

    const handleChange = (e) => {
        setFormData({
        ...formData,
        [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
        const response = await axios.post(`${BACKEND_URL}/api/recommend-fertilizer`, {
            crop_type: formData.crop_type,
            soil_type: formData.soil_type,
            nitrogen: parseFloat(formData.nitrogen),
            phosphorous: parseFloat(formData.phosphorous),
            potassium: parseFloat(formData.potassium),
            temperature: parseFloat(formData.temperature),
            moisture: parseFloat(formData.moisture),
            rainfall: parseFloat(formData.rainfall),
            ph: parseFloat(formData.ph),
            carbon: parseFloat(formData.carbon)
        });

        if (response.data.success) {
            setResult(response.data);
        } else {
            setError(response.data.error || 'Failed to get recommendation. Please try again.');
        }
        } catch (err) {
        setError(err.response?.data?.error || 'Failed to get recommendation. Please try again.');
        console.error('Error:', err);
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-slate-900 dark:to-slate-800 py-12">
        <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-block p-4 bg-purple-100 rounded-full mb-4">
                <span className="text-5xl">🧪</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mb-4 dark:text-gray-200" data-testid="fertilizer-title">
                Fertilizer Recommendation
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                Get personalized fertilizer recommendations for optimal crop growth
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 dark:bg-gray-600/80 backdrop-blur-sm">
                <form onSubmit={handleSubmit}>
                {/* Crop and Soil Selection */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                        🌱 Crop Type
                    </label>
                    <select
                        name="crop_type"
                        value={formData.crop_type}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:text-gray-200 bg-white/80 dark:bg-slate-700/75 focus:bg-white/90 dark:focus:bg-slate-700/90"
                        data-testid="select-crop-type"
                    >
                        <option value="">Choose a crop...</option>
                        {cropTypes.map(crop => (
                        <option key={crop} value={crop}>{crop}</option>
                        ))}
                    </select>
                    </div>
                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                        🏞️ Soil Type
                    </label>
                    <select
                        name="soil_type"
                        value={formData.soil_type}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:text-gray-300 bg-white/80 dark:bg-slate-700/75 focus:bg-white/90 dark:focus:bg-slate-700/90"
                        data-testid="select-soil-type"
                    >
                        <option value="">Choose soil type...</option>
                        {soilTypes.map(soil => (
                        <option key={soil} value={soil}>{soil}</option>
                        ))}
                    </select>
                    </div>
                </div>

                {/* NPK Values */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 dark:text-gray-200">Current Soil Nutrient Levels</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                        🔵 Nitrogen (N) - kg/ha
                        </label>
                        <input
                        type="number"
                        step="0.01"
                        name="nitrogen"
                        value={formData.nitrogen}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:text-gray-300 bg-white/80 dark:bg-slate-700/75 focus:bg-white/90 dark:focus:bg-slate-700/90"
                        placeholder="e.g. 90"
                        data-testid="input-nitrogen"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                        🟠 Phosphorus (P) - kg/ha
                        </label>
                        <input
                        type="number"
                        step="0.01"
                        name="phosphorous"
                        value={formData.phosphorous}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:text-gray-300 bg-white/80 dark:bg-slate-700/75 focus:bg-white/90 dark:focus:bg-slate-700/90"
                        placeholder="e.g. 42"
                        data-testid="input-phosphorus"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                        🟣 Potassium (K) - kg/ha
                        </label>
                        <input
                        type="number"
                        step="0.01"
                        name="potassium"
                        value={formData.potassium}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:text-gray-300 bg-white/80 dark:bg-slate-700/75 focus:bg-white/90 dark:focus:bg-slate-700/90"
                        placeholder="e.g. 43"
                        data-testid="input-potassium"
                        />
                    </div>
                    </div>
                </div>

                {/* Environmental Values */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Environmental Conditions</h3>
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        🌡️ Temperature (°C)
                        </label>
                        <input
                        type="number"
                        step="0.01"
                        name="temperature"
                        value={formData.temperature}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:text-gray-300 bg-white/80 dark:bg-slate-700/75 focus:bg-white/90 dark:focus:bg-slate-700/90"
                        placeholder="e.g. 28"
                        data-testid="input-temperature"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        💧 Moisture (%)
                        </label>
                        <input
                        type="number"
                        step="0.01"
                        name="moisture"
                        value={formData.moisture}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:text-gray-300 bg-white/80 dark:bg-slate-700/75 focus:bg-white/90 dark:focus:bg-slate-700/90"
                        placeholder="e.g. 40"
                        data-testid="input-moisture"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        🌧️ Rainfall (mm)
                        </label>
                        <input
                        type="number"
                        step="0.01"
                        name="rainfall"
                        value={formData.rainfall}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:text-gray-300 bg-white/80 dark:bg-slate-700/75 focus:bg-white/90 dark:focus:bg-slate-700/90"
                        placeholder="e.g. 100"
                        data-testid="input-rainfall"
                        />
                    </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        ⚗️ pH
                        </label>
                        <input
                        type="number"
                        step="0.01"
                        name="ph"
                        value={formData.ph}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:text-gray-300 bg-white/80 dark:bg-slate-700/75 focus:bg-white/90 dark:focus:bg-slate-700/90"
                        placeholder="e.g. 6.5"
                        data-testid="input-ph"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        🌿 Organic Carbon
                        </label>
                        <input
                        type="number"
                        step="0.01"
                        name="carbon"
                        value={formData.carbon}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:text-gray-300 bg-white/80 dark:bg-slate-700/75 focus:bg-white/90 dark:focus:bg-slate-700/90"
                        placeholder="e.g. 0.5"
                        data-testid="input-carbon"
                        />
                    </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-600 hover:to-pink-700 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    data-testid="recommend-fertilizer-button"
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
                    'Get Recommendation'
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
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-xl p-8 animate-fade-in" data-testid="fertilizer-result">
                <div className="text-center mb-8">
                    <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-4">
                    <span className="text-6xl">✨</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Recommendation Ready</h2>
                    <div className="inline-block bg-purple-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    {result.confidence}% Confidence
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Recommended Fertilizer</h3>
                    <p className="text-4xl font-bold text-purple-600 mb-3" data-testid="recommended-fertilizer">
                    {result.recommended_fertilizer}
                    </p>
                    <div className="mt-4">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Application Rate:</span>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{result.quantity}</p>
                    </div>
                </div>
                </div>
            )}
            </div>
        </div>
        </div>
    );
}

export default Fertilizer;