import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    location: '',
    land_size: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })
      const data = await response.json()

      if (response.ok && data.success) {
        navigate('/login')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_55%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.18),_transparent_40%)] dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_55%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.08),_transparent_40%)] p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/20 dark:border-slate-700/50 bg-white/10 dark:bg-slate-900/40 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full mb-3 shadow-lg">
            <span className="text-3xl block">🌱</span>
          </div>
          <h1 className="text-3xl font-baloo bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent mb-2">Join DHARA</h1>
          <p className="text-black/80 dark:text-white/80">Create your farmer account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-black/90 dark:text-white/90 text-sm mb-1 flex items-center gap-2 font-medium">
              <span>👤</span>
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 bg-white/10 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 rounded-xl text-black dark:text-white placeholder-black/60 dark:placeholder-white/60 focus:bg-white/20 dark:focus:bg-slate-800/70 focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none transition-all"
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label className="text-black/90 dark:text-white/90 text-sm mb-1 flex items-center gap-2 font-medium">
              <span>📧</span>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 bg-white/10 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 rounded-xl text-black dark:text-white placeholder-black/60 dark:placeholder-white/60 focus:bg-white/20 dark:focus:bg-slate-800/70 focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none transition-all"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="text-black/90 dark:text-white/90 text-sm mb-1 flex items-center gap-2 font-medium">
              <span>🔒</span>
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full p-3 bg-white/10 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 rounded-xl text-black dark:text-white placeholder-black/60 dark:placeholder-white/60 focus:bg-white/20 dark:focus:bg-slate-800/70 focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-black/90 dark:text-white/90 text-sm mb-1 flex items-center gap-1 font-medium">
                <span>📍</span>
                <span className="truncate">Location</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full p-3 bg-white/10 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 rounded-xl text-black dark:text-white placeholder-black/60 dark:placeholder-white/60 focus:bg-white/20 dark:focus:bg-slate-800/70 focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none transition-all text-sm"
                placeholder="Village/city"
              />
            </div>

            <div>
              <label className="text-black/90 dark:text-white/90 text-sm mb-1 flex items-center gap-1 font-medium">
                <span>🌾</span>
                <span className="truncate">Land Size</span>
              </label>
              <input
                type="text"
                value={formData.land_size}
                onChange={(e) => setFormData({...formData, land_size: e.target.value})}
                className="w-full p-3 bg-white/10 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 rounded-xl text-black dark:text-white placeholder-black/60 dark:placeholder-white/60 focus:bg-white/20 dark:focus:bg-slate-800/70 focus:border-orange-500 dark:focus:border-orange-400 focus:outline-none transition-all text-sm"
                placeholder="e.g. 2 acres"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/20 p-3 text-sm text-red-700 dark:text-red-200 font-medium animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white py-3 px-4 rounded-xl font-semibold transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-black/70 dark:text-white/70">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register