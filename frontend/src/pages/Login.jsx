import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass p-8 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-baloo text-dhara-green mb-2">🌿 DHARA</h1>
          <p className="text-white/80">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/90 text-sm mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:bg-white/20 focus:border-dhara-green focus:outline-none transition-all"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-white/90 text-sm mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:bg-white/20 focus:border-dhara-green focus:outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="glass bg-red-500/20 border-red-500/40 text-red-100 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-dhara-green to-green-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-500 hover:to-dhara-green transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-white/70">
          Don't have an account?{' '}
          <Link to="/register" className="text-dhara-green hover:underline font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login