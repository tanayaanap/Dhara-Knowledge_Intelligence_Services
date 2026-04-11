import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })
      const data = await response.json()

      if (response.ok && data.success) {
        navigate('/')
      } else {
        setError(data.error || 'Invalid credentials')
      }
    } catch (err) {
      setError('Login failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_55%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.18),_transparent_40%)] dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_55%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.08),_transparent_40%)] p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/20 dark:border-slate-700/50 bg-white/10 dark:bg-slate-900/40 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-3 shadow-lg">
            <span className="text-3xl block">🌿</span>
          </div>
          <h1 className="text-3xl font-baloo bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-2">DHARA</h1>
          <p className="text-black/80 dark:text-white/80">Welcome back, farmer! 🌾</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="inline-flex items-center gap-2 text-sm text-black/90 dark:text-white/90 mb-2 font-medium">
              <span>📧</span>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 bg-white/10 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 rounded-xl text-black dark:text-white placeholder-black/60 dark:placeholder-white/60 focus:bg-white/20 dark:focus:bg-slate-800/70 focus:border-green-500 dark:focus:border-green-400 focus:outline-none transition-all"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="inline-flex items-center gap-2 text-sm text-black/90 dark:text-white/90 mb-2 font-medium">
              <span>🔒</span>
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full p-3 bg-white/10 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 rounded-xl text-black dark:text-white placeholder-black/60 dark:placeholder-white/60 focus:bg-white/20 dark:focus:bg-slate-800/70 focus:border-green-500 dark:focus:border-green-400 focus:outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/20 p-3 text-sm text-red-700 dark:text-red-200 font-medium animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-4 rounded-xl font-semibold transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-black/70 dark:text-white/70">
          Don't have an account?{' '}
          <Link to="/register" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login