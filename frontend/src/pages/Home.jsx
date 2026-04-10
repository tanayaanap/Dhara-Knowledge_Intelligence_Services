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
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="rounded-3xl bg-red-500/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500/50"
        >
          Logout
        </button>
      </div>

      <div className="text-center">
        <h1 className="text-4xl font-baloo text-dhara-green drop-shadow-2xl tracking-wide sm:text-5xl">
          🌿 PROJECT DHARA
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm opacity-80">
          {user ? `Welcome back, ${user.name}!` : 'AI-powered crop recommendation for smart farming'}
        </p>
      </div>

      {uploadError && (
        <div className="rounded-3xl border border-red-500/40 bg-red-500/20 p-4 text-sm text-red-100 animate-pulse">
          ⚠️ {uploadError}
        </div>
      )}

      <section className="rounded-[28px] border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-dhara-green">
          <span>📄</span>
          <span>Upload Soil Test Report</span>
        </div>
        <UploadZone onUpload={handleUpload} />
        <button
          disabled={uploadLoading}
          className="mt-4 w-full rounded-3xl bg-gradient-to-r from-emerald-500 to-dhara-green py-3 text-sm font-semibold text-white transition duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploadLoading ? 'Processing...' : '🔍 Extract & Predict'}
        </button>
      </section>

      {uploadResults.length > 0 && (
        <section className="rounded-[28px] border border-dhara-green/50 bg-dhara-green/10 p-6 shadow-2xl shadow-black/15">
          <h3 className="mb-4 text-xl font-semibold text-dhara-green">🌾 Top Recommended Crops</h3>
          <div className="space-y-3">
            {uploadResults.map((result, index) => (
              <div key={index} className="text-lg">
                <span className="font-bold text-white">{index + 1}.</span>{' '}
                {result.crop} — <span className="text-dhara-green font-semibold">{result.probability}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {Object.keys(extracted).length > 0 && (
        <section className="rounded-[28px] border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/15">
          <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-dhara-green">
            <span>🔬</span>
            <span>Extracted Values</span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {Object.entries(extracted).map(([key, val]) => (
              <div key={key} className="rounded-3xl border border-white/20 bg-white/10 p-4 text-center">
                <div className="text-xs uppercase tracking-[0.2em] text-white/70">{key}</div>
                <div className="mt-2 text-lg font-bold text-dhara-green">{val || '—'}</div>
              </div>
            ))}
          </div>
          {usedDefaults.length > 0 && (
            <div className="mt-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
              ⚡ Defaults used: {usedDefaults.join(', ')}
            </div>
          )}
        </section>
      )}

      <section className="rounded-[28px] border border-white/20 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-dhara-green">
          <span>✏️</span>
          <span>Enter Values Manually</span>
        </div>
        <form onSubmit={handlePredict} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="N"
              type="number"
              value={formData.N}
              onChange={(e) => setFormData({ ...formData, N: e.target.value })}
              placeholder="Nitrogen"
              className="rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-dhara-green focus:bg-white/20"
              step="0.01"
              required
            />
            <input
              name="P"
              type="number"
              value={formData.P}
              onChange={(e) => setFormData({ ...formData, P: e.target.value })}
              placeholder="Phosphorus"
              className="rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-dhara-green focus:bg-white/20"
              step="0.01"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="K"
              type="number"
              value={formData.K}
              onChange={(e) => setFormData({ ...formData, K: e.target.value })}
              placeholder="Potassium"
              className="rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-dhara-green focus:bg-white/20"
              step="0.01"
              required
            />
            <input
              name="ph"
              type="number"
              value={formData.ph}
              onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
              placeholder="pH"
              className="rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-dhara-green focus:bg-white/20"
              step="0.01"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="temperature"
              type="number"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              placeholder="Temp (°C)"
              className="rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-dhara-green focus:bg-white/20"
              step="0.01"
              required
            />
            <input
              name="humidity"
              type="number"
              value={formData.humidity}
              onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
              placeholder="Humidity (%)"
              className="rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-dhara-green focus:bg-white/20"
              step="0.01"
              required
            />
          </div>
          <input
            name="rainfall"
            type="number"
            value={formData.rainfall}
            onChange={(e) => setFormData({ ...formData, rainfall: e.target.value })}
            placeholder="Rainfall (mm)"
            className="w-full rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition focus:border-dhara-green focus:bg-white/20"
            step="0.01"
            required
          />
          <button
            type="submit"
            disabled={predictLoading}
            className="w-full rounded-3xl bg-gradient-to-r from-dhara-green to-emerald-500 py-3 text-sm font-semibold text-white transition duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {predictLoading ? 'Predicting...' : '🌱 Predict Crop'}
          </button>
        </form>

        {topResults.length > 0 && (
          <div className="mt-6 rounded-[28px] border border-dhara-green/50 bg-dhara-green/10 p-6 shadow-2xl shadow-black/15">
            <h3 className="mb-4 text-xl font-semibold text-dhara-green">🌾 Top Recommended Crops</h3>
            <div className="space-y-2">
              {topResults.map((result, index) => (
                <div key={index} className="text-lg">
                  <span className="font-bold text-white">{index + 1}.</span>{' '}
                  {result.crop} — <span className="text-dhara-green font-semibold">{result.probability}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-xl text-white shadow-2xl transition hover:scale-110"
        >
          💬
        </button>
      </div>

      {chatOpen && (
        <div className="fixed bottom-20 right-8 z-50 flex h-[24rem] w-80 flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 bg-emerald-500 px-4 py-3 text-white font-semibold">
            <span>🌱</span>
            <span>DHARA Assistant</span>
            <button onClick={() => setChatOpen(false)} className="ml-auto text-white/80 hover:text-white">
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-black/5 p-4">
            {chatMessages.map((msg, index) => (
              <div key={index} className="mb-4">
                <div className="text-sm font-semibold text-emerald-400">{msg.sender}:</div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-white/90">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2 border-t border-white/10 p-3">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
              placeholder="Ask about crops..."
              className="flex-1 rounded-3xl border border-white/20 bg-white/10 px-4 py-2 text-white outline-none transition focus:border-dhara-green focus:bg-white/20"
            />
            <button
              onClick={handleChatSend}
              className="rounded-3xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
