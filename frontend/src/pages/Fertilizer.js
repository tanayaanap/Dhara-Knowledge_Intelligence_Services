import React, { useState } from 'react'
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Fertilizer() {
    const [formData, setFormData] = useState({
        crop_type: '',
        nitrogen: '',
        phosphorus: '',
        potassium: '',
        soil_type: ''
    });
    
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const cropTypes = ['Rice', 'Wheat', 'Cotton', 'Maize', 'Sugarcane', 'Barley', 'Soybean', 'Potato', 'Tomato', 'Vegetables'];
    const soilTypes = ['Sandy', 'Loamy', 'Clay', 'Red', 'Black'];

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
            nitrogen: parseFloat(formData.nitrogen),
            phosphorus: parseFloat(formData.phosphorus),
            potassium: parseFloat(formData.potassium),
            soil_type: formData.soil_type
        });
        
        setResult(response.data);
        } catch (err) {
        setError('Failed to get recommendation. Please try again.');
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
                        placeholder="0-100"
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
                        name="phosphorus"
                        value={formData.phosphorus}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all dark:text-gray-300 bg-white/80 dark:bg-slate-700/75 focus:bg-white/90 dark:focus:bg-slate-700/90"
                        placeholder="0-100"
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
                        placeholder="0-100"
                        data-testid="input-potassium"
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
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-xl p-8 animate-fade-in" data-testid="fertilizer-result">
                <div className="text-center mb-8">
                    <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-4">
                    <span className="text-6xl">✨</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Recommendation Ready</h2>
                    <div className="inline-block bg-purple-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    {result.confidence}% Confidence
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">Recommended Fertilizer</h3>
                    <p className="text-4xl font-bold text-purple-600 mb-3" data-testid="recommended-fertilizer">
                    {result.recommended_fertilizer}
                    </p>
                    <div className="mt-4">
                    <span className="text-sm font-semibold text-gray-500">Application Rate:</span>
                    <p className="text-2xl font-bold text-gray-800">{result.quantity}</p>
                    </div>
                </div>

                {result.application_tips && result.application_tips.length > 0 && (
                    <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
                    <h3 className="text-sm font-semibold text-gray-500 mb-3">📋 Application Tips</h3>
                    <ul className="space-y-2">
                        {result.application_tips.map((tip, index) => (
                        <li key={index} className="flex items-start">
                            <span className="inline-block w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            {index + 1}
                            </span>
                            <span className="text-gray-700">{tip}</span>
                        </li>
                        ))}
                    </ul>
                    </div>
                )}

                <div className="bg-white rounded-xl p-6 shadow-md">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">📝 Additional Notes</h3>
                    <p className="text-gray-700 leading-relaxed">{result.notes}</p>
                </div>
                </div>
            )}
            </div>
        </div>
        </div>
    );
}

export default Fertilizer;