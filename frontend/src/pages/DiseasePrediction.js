import React, { useState } from 'react'
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function DiseasePrediction() {
    const [formData, setFormData] = useState({
        crop_type: '',
        temperature: '',
        humidity: '',
        symptoms: []
    });
    
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const cropTypes = ['Rice', 'Wheat', 'Cotton', 'Maize', 'Sugarcane', 'Barley', 'Soybean', 'Potato', 'Tomato'];
    
    const availableSymptoms = [
        'Yellow leaves',
        'Brown spots',
        'Wilting',
        'Leaf curl',
        'Mold growth',
        'Stunted growth',
        'Discolored stems',
        'Holes in leaves',
        'Powdery coating'
    ];

    const handleChange = (e) => {
        setFormData({
        ...formData,
        [e.target.name]: e.target.value
        });
    };

    const toggleSymptom = (symptom) => {
        setFormData(prev => ({
        ...prev,
        symptoms: prev.symptoms.includes(symptom)
            ? prev.symptoms.filter(s => s !== symptom)
            : [...prev.symptoms, symptom]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
        const response = await axios.post(`${BACKEND_URL}/api/predict-disease`, {
            crop_type: formData.crop_type,
            symptoms: formData.symptoms,
            temperature: parseFloat(formData.temperature),
            humidity: parseFloat(formData.humidity)
        });
        
        setResult(response.data);
        } catch (err) {
        setError('Failed to get prediction. Please try again.');
        console.error('Error:', err);
        } finally {
        setLoading(false);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
        case 'low':
            return 'bg-green-100 text-green-700 border-green-300';
        case 'medium':
            return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        case 'high':
            return 'bg-red-100 text-red-700 border-red-300';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
                <span className="text-5xl">🔬</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mb-4" data-testid="disease-prediction-title">
                Disease Prediction
                </h1>
                <p className="text-lg text-gray-600">
                Identify crop diseases early with AI-powered analysis
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                <form onSubmit={handleSubmit}>
                {/* Crop Type Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🌱 Select Crop Type
                    </label>
                    <select
                    name="crop_type"
                    value={formData.crop_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    data-testid="select-crop-type"
                    >
                    <option value="">Choose a crop...</option>
                    {cropTypes.map(crop => (
                        <option key={crop} value={crop}>{crop}</option>
                    ))}
                    </select>
                </div>

                {/* Environmental Conditions */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🌡️ Temperature (°C)
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        name="temperature"
                        value={formData.temperature}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter temperature"
                        data-testid="input-temperature"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        💧 Humidity (%)
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        name="humidity"
                        value={formData.humidity}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter humidity"
                        data-testid="input-humidity"
                    />
                    </div>
                </div>

                {/* Symptoms Selection */}
                <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🩺 Select Symptoms (choose all that apply)
                    </label>
                    <div className="grid md:grid-cols-3 gap-3">
                    {availableSymptoms.map(symptom => (
                        <button
                        key={symptom}
                        type="button"
                        onClick={() => toggleSymptom(symptom)}
                        className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                            formData.symptoms.includes(symptom)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                        }`}
                        data-testid={`symptom-${symptom.toLowerCase().replace(/s/g, '-')}`}
                        >
                        {symptom}
                        </button>
                    ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || formData.symptoms.length === 0}
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
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-xl p-8 animate-fade-in" data-testid="disease-result">
                <div className="text-center mb-8">
                    <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-4">
                    <span className="text-6xl">{result.disease === 'Healthy' ? '✅' : '⚠️'}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Diagnosis Result</h2>
                    <div className="inline-block bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    {result.confidence}% Confidence
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">Detected Condition</h3>
                    <p className="text-4xl font-bold text-blue-600 mb-3" data-testid="detected-disease">{result.disease}</p>
                    <span className={`inline-block px-4 py-2 rounded-full border-2 font-semibold ${getSeverityColor(result.severity)}`}>
                    {result.severity} Severity
                    </span>
                </div>

                {result.treatment && result.treatment.length > 0 && (
                    <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
                    <h3 className="text-sm font-semibold text-gray-500 mb-3">💊 Treatment Recommendations</h3>
                    <ul className="space-y-2">
                        {result.treatment.map((step, index) => (
                        <li key={index} className="flex items-start">
                            <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            {index + 1}
                            </span>
                            <span className="text-gray-700">{step}</span>
                        </li>
                        ))}
                    </ul>
                    </div>
                )}

                <div className="bg-white rounded-xl p-6 shadow-md">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">🛡️ Prevention Tips</h3>
                    <p className="text-gray-700 leading-relaxed">{result.prevention}</p>
                </div>
                </div>
            )}
            </div>
        </div>
        </div>
    );
}

export default DiseasePrediction;