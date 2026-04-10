import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UploadZone from '../components/UploadZone'

const Home = () => {
  const [uploadResults, setUploadResults] = useState([])
  const [topResults, setTopResults] = useState([])
  const [extracted, setExtracted] = useState({})
  const [sources, setSources] = useState({})
  const [usedDefaults, setUsedDefaults] = useState([])
  const [rawText, setRawText] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [predictLoading, setPredictLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [formData, setFormData] = useState({
    N: '',
    P: '',
    K: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: ''
  })
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()
  const [userLoading, setUserLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/user', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsAuthenticated(true)
      } else {
        navigate('/login')
      }
    } catch (error) {
      navigate('/login')
    }
    setUserLoading(false)
  }

  const handlePredict = async (e) => {
    e.preventDefault()
    setPredictLoading(true)
    setTopResults([])
    
    try {
      const data = new FormData(e.target)
      const response = await fetch('/api/predict', {
        method: 'POST',
        body: data,
        credentials: 'include'
      })
      const result = await response.json()
      if (result.success) {
        setTopResults(result.top_results)
      }
    } catch (error) {
      console.error('Predict error:', error)
    }
    setPredictLoading(false)
  }

  const handleUpload = async (formData) => {
    setUploadLoading(true)
    setUploadError('')
    setUploadResults([])
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      const result = await response.json()
      if (result.success) {
        setUploadResults(result.upload_results)
        setExtracted(result.extracted || {})
        setSources(result.sources || {})
        setUsedDefaults(result.used_defaults || [])
        setRawText(result.raw_text || '')
      } else {
        setUploadError(result.error)
      }
    } catch (error) {
      setUploadError('Upload failed')
    }
    setUploadLoading(false)
  }

  const handleChatSend = async () => {
    if (!chatInput.trim()) return
    
    const userMsg = chatInput.trim()
    setChatMessages(prev => [...prev, { sender: 'You', text: userMsg }])
    setChatInput('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: userMsg })
      })
      const data = await response.json()
      setChatMessages(prev => [...prev, { sender: 'DHARA 🌱', text: data.reply }])
    } catch (error) {
      setChatMessages(prev => [...prev, { sender: 'DHARA 🌱', text: 'Sorry, chat unavailable.' }])
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' })
    } catch (error) {}
    navigate('/login')
  }

  if (userLoading) {
    return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>
  }

  return (
    <div className="wrapper">
      <button 
        onClick={handleLogout}
        className="glass p-3 rounded-xl text-white font-semibold bg-red-500/30 hover:bg-red-500/50 transition-all duration-200 self-end"
      >
        Logout
      </button>

      <div className="header text-center">
        <h1 className="text-4xl md:text-5xl font-baloo text-dhara-green drop-shadow-2xl mb-2 tracking-wide">
          🌿 PROJECT DHARA
        </h1>
        <p className="text-sm opacity-85 max-w-md mx-auto">
          {user ? `Welcome back, ${user.name}!` : 'AI-powered crop recommendation for smart farming'}
        </p>
      </div>

      {uploadError && (
        <div className="glass bg-red-500/20 border-2 border-red-500/40 p-4 rounded-xl animate-pulse">
          ⚠️ {uploadError}
        </div>
      )}

      <div className="glass p-6">
        <h2 className="text-lg font-semibold text-dhara-green mb-4 flex items-center gap-2">
          📄 Upload Soil Test Report
        </h2>
        <UploadZone onUpload={handleUpload} />
        <button 
          disabled={uploadLoading}
          className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-dhara-green text-white py-3 rounded-xl font-semibold hover:scale-105 transition-all disabled:opacity-50"
        >
          {uploadLoading ? 'Processing...' : '🔍 Extract & Predict'}
        </button>
      </div>

      {uploadResults.length > 0 && (
        <div className="glass p-6 border-2 border-dhara-green/50 bg-dhara-green/10">
          <h3 className="text-xl font-semibold text-dhara-green mb-4">🌾 Top Recommended Crops</h3>
          <div className="space-y-2">
            {uploadResults.map((result, index) => (
              <div key={index} className="text-lg">
                <span className="font-bold text-white">{index + 1}.</span> {result.crop} — <span className="text-dhara-green font-semibold">{result.probability}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(extracted).length > 0 && (
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-dhara-green mb-4 flex items-center gap-2">🔬 Extracted Values</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {Object.entries(extracted).map(([key, val]) => (
              <div key={key} className="glass p-3 rounded-xl text-center">
                <div className="text-xs uppercase opacity-70">{key}</div>
                <div className="font-bold text-lg text-dhara-green">{val || '—'}</div>
              </div>
            ))}
          </div>
          {usedDefaults.length > 0 && (
            <div className="text-xs text-amber-300 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              ⚡ Defaults used: {usedDefaults.join(', ')}
            </div>
          )}
        </div>
      )}

      <div className="glass p-6">
        <h2 className="text-lg font-semibold text-dhara-green mb-4 flex items-center gap-2">
          ✏️ Enter Values Manually
        </h2>
        <form onSubmit={handlePredict} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              name="N"
              type="number"
              value={formData.N}
              onChange={(e) => setFormData({...formData, N: e.target.value})}
              placeholder="Nitrogen"
              className="p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:bg-white/20 focus:border-dhara-green transition-all"
              step="0.01"
              required
            />
            <input
              name="P"
              type="number"
              value={formData.P}
              onChange={(e) => setFormData({...formData, P: e.target.value})}
              placeholder="Phosphorus"
              className="p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:bg-white/20 focus:border-dhara-green transition-all"
              step="0.01"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="K"
              type="number"
              value={formData.K}
              onChange={(e) => setFormData({...formData, K: e.target.value})}
              placeholder="Potassium"
              className="p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:bg-white/20 focus:border-dhara-green transition-all"
              step="0.01"
              required
            />
            <input
              name="ph"
              type="number"
              value={formData.ph}
              onChange={(e) => setFormData({...formData, ph: e.target.value})}
              placeholder="pH"
              className="p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:bg-white/20 focus:border-dhara-green transition-all"
              step="0.01"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="temperature"
              type="number"
              value={formData.temperature}
              onChange={(e) => setFormData({...formData, temperature: e.target.value})}
              placeholder="Temp (°C)"
              className="p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:bg-white/20 focus:border-dhara-green transition-all"
              step="0.01"
              required
            />
            <input
              name="humidity"
              type="number"
              value={formData.humidity}
              onChange={(e) => setFormData({...formData, humidity: e.target.value})}
              placeholder="Humidity (%)"
              className="p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:bg-white/20 focus:border-dhara-green transition-all"
              step="0.01"
              required
            />
          </div>
          <input
            name="rainfall"
            type="number"
            value={formData.rainfall}
            onChange={(e) => setFormData({...formData, rainfall: e.target.value})}
            placeholder="Rainfall (mm)"
            className="p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:bg-white/20 focus:border-dhara-green transition-all w-full"
            step="0.01"
            required
          />
          <button
            type="submit"
            disabled={predictLoading}
            className="w-full bg-gradient-to-r from-dhara-green to-emerald-500 text-white py-3 px-4 rounded-xl font-semibold hover:scale-105 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {predictLoading ? 'Predicting...' : '🌱 Predict Crop'}
          </button>
        </form>

        {topResults.length > 0 && (
          <div className="mt-6 glass p-6 border-2 border-dhara-green/50 bg-dhara-green/10">
            <h3 className="text-xl font-semibold text-dhara-green mb-4">🌾 Top Recommended Crops</h3>
            <div className="space-y-2">
              {topResults.map((result, index) => (
                <div key={index} className="text-lg">
                  <span className="font-bold text-white">{index + 1}.</span> {result.crop} — <span className="text-dhara-green font-semibold">{result.probability}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div 
        className="fixed bottom-8 right-8 w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-2xl hover:scale-110 transition-all z-50 shadow-lg hover:shadow-2xl"
        onClick={() => setChatOpen(!chatOpen)}
      >
        💬
      </div>

      {chatOpen && (
        <div className="fixed bottom-20 right-8 w-80 h-96 glass rounded-2xl flex flex-col shadow-2xl z-50 border border-white/20 overflow-hidden">
          <div className="bg-emerald-500 p-4 text-white font-semibold flex items-center gap-2">
            🌱 DHARA Assistant
            <button onClick={() => setChatOpen(false)} className="ml-auto text-white/70 hover:text-white">×</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto bg-black/5">
            {chatMessages.map((msg, index) => (
              <div key={index} className="mb-4">
                <span className="font-semibold text-emerald-400">{msg.sender}:</span>
                <div className="mt-1 text-sm whitespace-pre-wrap">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
              placeholder="Ask about crops..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl p-2 text-white placeholder-white/60 focus:bg-white/20 focus:border-dhara-green outline-none"
            />
            <button
              onClick={handleChatSend}
              className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-600 transition-colors whitespace-nowrap"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <style>{`
        .wrapper { max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }
        .header h1 { font-size: 2.5rem; }
        @media (min-width: 768px) { .header h1 { font-size: 3.5rem; } }
        .glass { background: rgba(255,255,255,0.13); backdrop-filter: blur(14px); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; }
        input { font-family: inherit; }
      `}</style>
    </div>
  )
}

export default Home
