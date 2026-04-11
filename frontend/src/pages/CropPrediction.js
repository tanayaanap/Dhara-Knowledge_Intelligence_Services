import React, { useState, useRef } from 'react'
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const INPUT_FIELDS = [
  { name: 'nitrogen', label: 'Nitrogen (N)', unit: 'kg/ha', icon: '🔵' },
  { name: 'phosphorus', label: 'Phosphorus (P)', unit: 'kg/ha', icon: '🟠' },
  { name: 'potassium', label: 'Potassium (K)', unit: 'kg/ha', icon: '🟣' },
  { name: 'temperature', label: 'Temperature', unit: '°C', icon: '🌡️' },
  { name: 'humidity', label: 'Humidity', unit: '%', icon: '💧' },
  { name: 'ph', label: 'pH Level', unit: '', icon: '⚗️' },
  { name: 'rainfall', label: 'Rainfall', unit: 'mm', icon: '🌧️' },
];

function CropPrediction() {
  const [activeTab, setActiveTab] = useState('manual');

  // Manual form state
  const [formData, setFormData] = useState({
    nitrogen: '', phosphorus: '', potassium: '',
    temperature: '', humidity: '', ph: '', rainfall: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // OCR upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const fileInputRef = useRef(null);

  // --- Manual Form Handlers ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/predict`, {
        N: parseFloat(formData.nitrogen),
        P: parseFloat(formData.phosphorus),
        K: parseFloat(formData.potassium),
        temperature: parseFloat(formData.temperature),
        humidity: parseFloat(formData.humidity),
        ph: parseFloat(formData.ph),
        rainfall: parseFloat(formData.rainfall),
      });
      setResult(response.data);
    } catch (err) {
      setError('Failed to get prediction. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- OCR Upload Handlers ---
  const acceptFile = (file) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setScanError('Please upload a JPG, PNG, or PDF file.');
      return;
    }
    setUploadFile(file);
    setScanResult(null);
    setScanError(null);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) acceptFile(file);
  };
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) acceptFile(file);
    e.target.value = '';
  };

  const handleScan = async () => {
    if (!uploadFile) return;
    setScanning(true);
    setScanError(null);
    setScanResult(null);
    const fd = new FormData();
    fd.append('file', uploadFile);
    try {
      const res = await fetch(`${BACKEND_URL}/api/ocr-scan`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        setScanResult(data);
      } else {
        setScanError(data.error || 'Failed to extract data. Please try a clearer image.');
      }
    } catch (e) {
      setScanError('Could not connect to the server. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const useExtractedValues = () => {
    if (!scanResult?.extracted) return;
    const updated = { ...formData };
    Object.entries(scanResult.extracted).forEach(([key, value]) => {
      if (key in updated) updated[key] = String(value);
    });
    setFormData(updated);
    setActiveTab('manual');
  };

  // Normalize backend result: { success, results: [{crop, probability}] }
  const topCrop = result?.results?.[0];
  const alternatives = result?.results?.slice(1) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-block p-4 bg-gradient-to-br from-green-200 to-emerald-200 dark:from-green-900 dark:to-emerald-900 rounded-full mb-4 shadow-lg">
              <span className="text-5xl animate-float">🌾</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-4" data-testid="crop-prediction-title">
              Crop Prediction
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Enter soil &amp; climate parameters manually, or upload a soil test report for auto-fill
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1.5 p-1.5 bg-gray-100 dark:bg-slate-800 rounded-xl mb-8 max-w-xs mx-auto">
            {[
              { id: 'manual', label: '✏️ Manual Entry' },
              { id: 'upload', label: '📄 Upload Report' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white shadow-sm text-green-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Manual Entry Tab ── */}
          {activeTab === 'manual' && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 dark:bg-slate-600/80 backdrop:blur-sm">
              <form onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {INPUT_FIELDS.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                        {field.icon} {field.label} {field.unit && `(${field.unit})`}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-800 dark:text-gray-500 bg-white/80 dark:bg-slate-700/75 focus:bg-white/90 dark:focus:bg-slate-700/90"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        data-testid={`input-${field.name}`}
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
                  ) : 'Predict Best Crop'}
                </button>
              </form>
            </div>
          )}

          {/* ── Upload Report Tab ── */}
          {activeTab === 'upload' && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 dark:bg-gray-600/80 backdrop-blur-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-1 dark:text-gray-200">Upload Soil Test Report</h2>
              <p className="text-sm text-gray-500 mb-6">
                Upload an image or PDF of your soil test report — we'll extract the values automatically using OCR.
              </p>

              {/* Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all select-none ${
                  isDragging
                    ? 'border-green-400 bg-green-50 scale-[1.01] dark:border-green-600 dark:bg-green-900/50 dark:text-gray-200'
                    : 'border-gray-300 hover:border-green-400 hover:bg-gray-50 dark:border-slate-600 dark:hover:border-green-400 dark:hover:bg-slate-700/50 dark:text-gray-200'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileSelect}
                />
                <div className="text-5xl mb-4">📤</div>
                <p className="text-gray-700 font-medium mb-1 dark:text-gray-300">Drag &amp; drop your soil report here</p>
                <p className="text-gray-400 text-sm mb-4 dark:text-gray-300">or click to browse files</p>
                <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium dark:bg-green-900/50 dark:text-gray-300">
                  Supports: JPG, PNG, PDF
                </span>
              </div>

              {/* Selected File Preview */}
              {uploadFile && (
                <div className="mt-4 flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                  <span className="text-3xl flex-shrink-0">
                    {uploadFile.type === 'application/pdf' ? '📄' : '🖼️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate text-sm">{uploadFile.name}</p>
                    <p className="text-xs text-gray-500">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadFile(null);
                      setScanResult(null);
                      setScanError(null);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                    aria-label="Remove file"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Scan Error */}
              {scanError && (
                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200 text-sm text-red-700 flex items-start gap-2">
                  <span className="flex-shrink-0">❌</span>
                  <span>{scanError}</span>
                </div>
              )}

              {/* Scan Button */}
              <button
                onClick={handleScan}
                disabled={!uploadFile || scanning}
                className="w-full mt-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {scanning ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Scanning Document...
                  </span>
                ) : '🔍 Extract Data from Report'}
              </button>

              {/* Extraction Results */}
              {scanResult && (
                <div className="mt-6 animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</div>
                    <h3 className="font-bold text-gray-800">Extraction Results</h3>
                    <span className="ml-auto text-xs text-gray-400">
                      {Object.keys(scanResult.extracted).length} / {INPUT_FIELDS.length} fields found
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {INPUT_FIELDS.map(field => {
                      const found = scanResult.extracted[field.name] !== undefined;
                      return (
                        <div
                          key={field.name}
                          className={`flex items-center gap-3 p-3 rounded-xl border ${
                            found ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <span className="text-xl flex-shrink-0">{field.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">{field.label}</p>
                            <p className={`font-semibold text-sm ${found ? 'text-green-700' : 'text-gray-400'}`}>
                              {found
                                ? `${scanResult.extracted[field.name]}${field.unit ? ' ' + field.unit : ''}`
                                : 'Not detected'}
                            </p>
                          </div>
                          <span className={`text-sm font-bold flex-shrink-0 ${found ? 'text-green-500' : 'text-gray-300'}`}>
                            {found ? '✓' : '✗'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {Object.keys(scanResult.extracted).length > 0 ? (
                    <button
                      onClick={useExtractedValues}
                      className="w-full mt-4 py-3 px-6 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      Fill Form with Extracted Values
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <p className="mt-4 text-center text-sm text-gray-500">
                      No values could be extracted. Please try a clearer image or use manual entry.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-xl" data-testid="error-message">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Prediction Result */}
          {result && topCrop && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-8 animate-fade-in" data-testid="crop-result">
              <div className="text-center mb-8">
                <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-4">
                  <span className="text-6xl">🎉</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">Prediction Result</h2>
                <div className="inline-block bg-green-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-sm">
                  {topCrop.probability}% Confidence
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
                <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Recommended Crop</h3>
                <p className="text-4xl font-bold text-green-600 capitalize" data-testid="predicted-crop">
                  {topCrop.crop}
                </p>
              </div>

              {alternatives.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Alternative Crops</h3>
                  <div className="flex flex-wrap gap-2">
                    {alternatives.map((alt, index) => (
                      <span key={index} className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium capitalize flex items-center gap-1">
                        {alt.crop}
                        <span className="text-green-500 text-xs">({alt.probability}%)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default CropPrediction;
