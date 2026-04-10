import React, { useState } from 'react'
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function CropPrediction() {
    const [formData, setFormData] = useState({
        nitrogen: '',
        phosphorus: '',
        potassium: '',
        temperature: '',
        humidity: '',
        ph: '',
        rainfall: ''
    });
    
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
        const response = await axios.post(`${BACKEND_URL}/api/predict`, {
            nitrogen: parseFloat(formData.nitrogen),
            phosphorus: parseFloat(formData.phosphorus),
            potassium: parseFloat(formData.potassium),
            temperature: parseFloat(formData.temperature),
            humidity: parseFloat(formData.humidity),
            ph: parseFloat(formData.ph),
            rainfall: parseFloat(formData.rainfall)
        });
        
        setResult(response.data);
        } catch (err) {
        setError('Failed to get prediction. Please try again.');
        console.error('Error:', err);
        } finally {
        setLoading(false);
        }
    };

    const inputFields = [
        { name: 'nitrogen', label: 'Nitrogen (N)', unit: 'kg/ha', icon: '🔵' },
        { name: 'phosphorus', label: 'Phosphorus (P)', unit: 'kg/ha', icon: '🟠' },
        { name: 'potassium', label: 'Potassium (K)', unit: 'kg/ha', icon: '🟣' },
        { name: 'temperature', label: 'Temperature', unit: '°C', icon: '🌡️' },
        { name: 'humidity', label: 'Humidity', unit: '%', icon: '💧' },
        { name: 'ph', label: 'pH Level', unit: '', icon: '⚗️' },
        { name: 'rainfall', label: 'Rainfall', unit: 'mm', icon: '🌧️' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
        <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                <span className="text-5xl">🌾</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mb-4" data-testid="crop-prediction-title">
                Crop Prediction
                </h1>
                <p className="text-lg text-gray-600">
                Enter your soil and climate parameters to get the best crop recommendation
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                <form onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {inputFields.map((field) => (
                    <div key={field.name}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {field.icon} {field.label} {field.unit && `(${field.unit})`}
                        </label>
                        <input
                        type="number"
                        step="0.01"
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        data-testid={`input-${field.name}`}
                        />
                    </div>
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    data-testid="predict-crop-button"
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
                    'Predict Best Crop'
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
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-8 animate-fade-in" data-testid="crop-result">
                <div className="text-center mb-8">
                    <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-4">
                    <span className="text-6xl">🎉</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Prediction Result</h2>
                    <div className="inline-block bg-green-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    {result.confidence}% Confidence
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">Recommended Crop</h3>
                    <p className="text-4xl font-bold text-green-600" data-testid="predicted-crop">{result.predicted_crop}</p>
                </div>

                {result.alternatives && result.alternatives.length > 0 && (
                    <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
                    <h3 className="text-sm font-semibold text-gray-500 mb-3">Alternative Crops</h3>
                    <div className="flex flex-wrap gap-2">
                        {result.alternatives.map((crop, index) => (
                        <span key={index} className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                            {crop}
                        </span>
                        ))}
                    </div>
                    </div>
                )}

                <div className="bg-white rounded-xl p-6 shadow-md">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">Recommendations</h3>
                    <p className="text-gray-700 leading-relaxed">{result.recommendations}</p>
                </div>
                </div>
            )}
            </div>
        </div>
        </div>
    );
}

export default CropPrediction;