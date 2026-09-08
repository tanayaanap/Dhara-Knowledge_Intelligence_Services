import React, { useState, useRef } from 'react'
import axios from 'axios';

// Relative path (routed through the CRA dev-server proxy) instead of an
// absolute URL -- an absolute URL makes every request cross-origin, and the
// browser then refuses to attach the Flask session cookie, so the backend
// never knows who's logged in (breaks location lookup + history saving).
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const INPUT_FIELDS = [
  { name: 'nitrogen', label: 'Nitrogen (N)', unit: 'kg/ha', icon: '🔵' },
  { name: 'phosphorus', label: 'Phosphorus (P)', unit: 'kg/ha', icon: '🟠' },
  { name: 'potassium', label: 'Potassium (K)', unit: 'kg/ha', icon: '🟣' },
  { name: 'temperature', label: 'Temperature', unit: '°C', icon: '🌡️' },
  { name: 'humidity', label: 'Humidity', unit: '%', icon: '💧' },
  { name: 'ph', label: 'pH Level', unit: '', icon: '⚗️' },
  { name: 'rainfall', label: 'Rainfall', unit: 'mm', icon: '🌧️' },
];

// The 12 Soil Health Card parameters the backend's OCR pipeline extracts.
// Keys must match app.py's SOIL_FIELD_KEYS exactly.
const SHC_FIELDS = [
  { key: 'nitrogen',   label: 'Nitrogen (N)',              unit: 'kg/ha', icon: '🌱' },
  { key: 'phosphorus', label: 'Phosphorus (P)',             unit: 'kg/ha', icon: '🧪' },
  { key: 'potassium',  label: 'Potassium (K)',              unit: 'kg/ha', icon: '💊' },
  { key: 'ph',         label: 'pH',                         unit: '',      icon: '⚗️' },
  { key: 'ec',         label: 'Electrical Conductivity',    unit: 'dS/m',  icon: '⚡' },
  { key: 'oc',         label: 'Organic Carbon',             unit: '%',     icon: '🌿' },
  { key: 'sulphur',    label: 'Sulphur (S)',                unit: 'ppm',   icon: '🟡' },
  { key: 'zinc',       label: 'Zinc (Zn)',                  unit: 'ppm',   icon: '🔘' },
  { key: 'iron',       label: 'Iron (Fe)',                  unit: 'ppm',   icon: '⚙️' },
  { key: 'manganese',  label: 'Manganese (Mn)',             unit: 'ppm',   icon: '🔩' },
  { key: 'copper',     label: 'Copper (Cu)',                unit: 'ppm',   icon: '🟠' },
  { key: 'boron',      label: 'Boron (B)',                  unit: 'ppm',   icon: '🔸' },
];

const STATUS_STYLES = {
  optimal:    { text: 'Optimal for this crop', className: 'bg-green-100 text-green-700' },
  acceptable: { text: 'Acceptable',            className: 'bg-blue-100 text-blue-700' },
  below:      { text: 'Below typical range',   className: 'bg-amber-100 text-amber-700' },
  above:      { text: 'Above typical range',   className: 'bg-amber-100 text-amber-700' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.acceptable;
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${s.className}`}>
      {s.text}
    </span>
  );
}

// Out-of-training-range warning -- shown when the model is extrapolating
// beyond anything it saw during training, so the confidence score shouldn't
// be trusted at face value. See app.py's check_out_of_training_range().
function OutOfRangeWarning({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
      <div className="font-semibold mb-1 flex items-center gap-1.5">
        <span>⚠️</span> Lower-confidence result
      </div>
      <p>
        {items.map((o, i) => (
          <span key={o.feature}>
            {i > 0 && ', '}
            <strong>{o.feature}</strong> ({o.value}, model was trained on {o.training_min}–{o.training_max})
          </span>
        ))}
        {' '}fall{items.length === 1 ? 's' : ''} outside the range this model has ever seen in training.
        Treat this recommendation as a rough estimate rather than a precise result.
      </p>
    </div>
  );
}

function ExplanationFactors({ factors }) {
  if (!factors || factors.length === 0) return null;
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
        Why this crop — factor breakdown
      </h3>
      <div className="space-y-3">
        {factors.map((f) => (
          <div key={f.feature} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
            <div className="min-w-0">
              <div className="font-medium text-gray-800">{f.feature}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Your value: <span className="font-medium text-gray-700">{f.value}</span>
                {' · '}Typical range for this crop: {f.typical_low}–{f.typical_high}
              </div>
            </div>
            <StatusBadge status={f.status} />
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-4">
        Ranges are computed directly from the model's training data (real min–max and typical values seen for this crop), not estimated.
      </p>
    </div>
  );
}

function ResultBlock({ results, insights, explanation }) {
  if (!results || results.length === 0) return null;
  const top = results[0];
  const alternatives = results.slice(1);

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-8 animate-fade-in mt-8" data-testid="crop-result">
      <OutOfRangeWarning items={explanation?.out_of_range} />

      <div className="text-center mb-6">
        <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-4">
          <span className="text-6xl">🎉</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Prediction Result</h2>
        <div className={`inline-block px-6 py-2 rounded-full text-sm font-semibold shadow-sm ${
          explanation?.low_confidence_warning ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {top.probability}% Confidence {explanation?.low_confidence_warning && '(use with caution)'}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
        <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Recommended Crop</h3>
        <p className="text-4xl font-bold text-green-600 capitalize mb-4" data-testid="predicted-crop">
          {top.crop}
        </p>
        {explanation?.narrative && (
          <p className="text-gray-700 leading-relaxed border-t border-gray-100 pt-4">
            {explanation.narrative}
          </p>
        )}
      </div>

      <div className="mb-6">
        <ExplanationFactors factors={explanation?.factors} />
      </div>

      {insights && insights.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-md mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
            Soil Health Insights <span className="normal-case font-normal text-gray-400">(ICAR / SHC reference bands)</span>
          </h3>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-sm ${
                  ins.severity === 'warning' ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'
                }`}
              >
                <span className="font-semibold">{ins.parameter}:</span> {ins.advice}
              </div>
            ))}
          </div>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Alternative Crops</h3>
          <div className="flex flex-wrap gap-2">
            {alternatives.map((alt, index) => (
              <span
                key={index}
                className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium capitalize flex items-center gap-1"
              >
                {alt.crop}
                <span className="text-green-500 text-xs">({alt.probability}%)</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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

    for (let key in formData) {
      if (formData[key] === "") {
        setError("Please fill all fields!");
        return;
      }
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/predict`,
        {
          N: Number(formData.nitrogen),
          P: Number(formData.phosphorus),
          K: Number(formData.potassium),
          temperature: Number(formData.temperature),
          humidity: Number(formData.humidity),
          ph: Number(formData.ph),
          rainfall: Number(formData.rainfall),
        },
        { withCredentials: true }
      );

      setResult(response.data);
    } catch (err) {
      console.log("ERROR:", err.response?.data || err.message);
      setError("Failed to get prediction. Check inputs.");
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

  // Maps the extracted SHC fields (nitrogen/phosphorus/potassium/ph) onto the
  // manual form's model inputs. Micronutrients (S, Zn, Fe, Mn, Cu, B) aren't
  // model inputs -- they only feed the Soil Health Insights panel -- so they
  // aren't copied here.
  const useExtractedValues = () => {
    if (!scanResult?.extracted) return;
    const updated = { ...formData };
    ['nitrogen', 'phosphorus', 'potassium', 'ph'].forEach((key) => {
      if (scanResult.extracted[key] !== undefined && scanResult.extracted[key] !== null) {
        updated[key] = String(scanResult.extracted[key]);
      }
    });
    if (scanResult.climate) {
      updated.temperature = String(scanResult.climate.temperature);
      updated.humidity = String(scanResult.climate.humidity);
      updated.rainfall = String(scanResult.climate.rainfall);
    }
    setFormData(updated);
    setActiveTab('manual');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
              <span className="text-5xl">🌾</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4" data-testid="crop-prediction-title">
              Crop Prediction
            </h1>
            <p className="text-lg text-gray-600">
              Enter soil &amp; climate parameters manually, or upload a soil test report for auto-fill
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1.5 p-1.5 bg-gray-100 rounded-xl mb-8 max-w-xs mx-auto">
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
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <form onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {INPUT_FIELDS.map((field) => (
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-6 rounded-xl" data-testid="error-message">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <ResultBlock results={result?.results} insights={result?.insights} explanation={result?.explanation} />
            </div>
          )}
          {/* END Manual Entry Tab */}

          {/* ── Upload Report Tab ── */}
          {activeTab === 'upload' && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">

              <h2 className="text-lg font-bold text-gray-800 mb-1">Upload Soil Test Report</h2>
              <p className="text-sm text-gray-500 mb-6">
                Upload an image or PDF of your soil test report — we'll extract the values automatically using OCR.
              </p>

              {/* Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all select-none ${
                  isDragging
                    ? 'border-green-400 bg-green-50 scale-[1.01]'
                    : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
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
                <p className="text-gray-700 font-medium mb-1">Drag &amp; drop your soil report here</p>
                <p className="text-gray-400 text-sm mb-4">or click to browse files</p>
                <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
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
                <div className="mt-6 p-4 bg-white rounded-xl shadow">

                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg">Extracted Parameters</h3>
                    <span className="text-xs font-medium text-gray-500">
                      {Object.keys(scanResult.extracted || {}).length} of {SHC_FIELDS.length} found
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded-xl overflow-hidden">
                      <thead className="bg-green-100 text-gray-700">
                        <tr>
                          <th className="p-2 text-left">Parameter</th>
                          <th className="p-2 text-left">Value</th>
                          <th className="p-2 text-left">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SHC_FIELDS.map((item) => {
                          const value = scanResult.extracted[item.key];
                          const missing = value === null || value === undefined;
                          const fromGemini = scanResult.gemini_filled?.includes(item.key);
                          const unitNote = scanResult.unit_notes?.[item.key];

                          return (
                            <tr key={item.key} className="border-t">
                              <td className="p-2">{item.icon} {item.label}</td>
                              <td className={`p-2 ${missing ? "text-gray-400" : "text-gray-800 font-medium"}`}>
                                {missing ? "Not found" : value}
                                {fromGemini && (
                                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">AI-assisted</span>
                                )}
                                {unitNote && (
                                  <div className="text-xs text-gray-400 mt-0.5">{unitNote}</div>
                                )}
                              </td>
                              <td className="p-2 text-gray-500">{item.unit || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Climate data (never comes from the report itself -- fetched by location) */}
                  {scanResult.climate && (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                      <div className="font-semibold mb-1">
                        🌦️ Climate data {scanResult.climate.location_used
                          ? `for ${scanResult.climate.location_used}`
                          : '— using defaults (add your location in Profile for accurate results)'}
                      </div>
                      <div className="flex gap-4 flex-wrap mt-1 text-xs">
                        <span>🌡️ {scanResult.climate.temperature}°C avg temp</span>
                        <span>💧 {scanResult.climate.humidity}% avg humidity</span>
                        <span>🌧️ {scanResult.climate.rainfall}mm annual rain</span>
                      </div>
                    </div>
                  )}

                  {Object.keys(scanResult.extracted || {}).length > 0 ? (
                    <button
                      onClick={useExtractedValues}
                      className="w-full mt-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                    >
                      Use These Values in Manual Form
                    </button>
                  ) : (
                    <p className="mt-4 text-center text-sm text-gray-500">
                      No values extracted — try a clearer scan, or enter values manually.
                    </p>
                  )}

                  <ResultBlock results={scanResult.results} insights={scanResult.insights} explanation={scanResult.explanation} />
                </div>
              )}
              {/* END Extraction Results */}

            </div>
          )}
          {/* END Upload Report Tab */}

        </div>
      </div>
    </div>
  );
}

export default CropPrediction;