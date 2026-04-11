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
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_55%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.18),_transparent_40%)] p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-baloo text-dhara-green mb-2">🌿 Join DHARA</h1>
          <p className="text-black/80">Create your farmer account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-black/90 text-sm mb-2 flex items-center gap-2">
              <span>👤</span>
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-black placeholder-black/60 focus:bg-white/20 focus:border-dhara-green focus:outline-none transition-all"
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label className="text-black/90 text-sm mb-2 flex items-center gap-2">
              <span>📧</span>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-black placeholder-black/60 focus:bg-white/20 focus:border-dhara-green focus:outline-none transition-all"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="text-black/90 text-sm mb-2 flex items-center gap-2">
              <span>🔒</span>
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-black placeholder-black/60 focus:bg-white/20 focus:border-dhara-green focus:outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-black/90 text-sm mb-2 flex items-center gap-2">
                <span>📍</span>
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-black placeholder-black/60 focus:bg-white/20 focus:border-dhara-green focus:outline-none transition-all"
                placeholder="Your village/city"
              />
            </div>

            <div>
              <label className="text-black/90 text-sm mb-2 flex items-center gap-2">
                <span>📏</span>
                Land Size
              </label>
              <input
                type="text"
                value={formData.land_size}
                onChange={(e) => setFormData({...formData, land_size: e.target.value})}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-black placeholder-black/60 focus:bg-white/20 focus:border-dhara-green focus:outline-none transition-all"
                placeholder="e.g. 2 acres"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/20 p-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-dhara-green to-green-500 text-black py-3 px-4 rounded-xl font-semibold hover:from-green-500 hover:to-dhara-green transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-black/70">
          Already have an account?{' '}
          <Link to="/login" className="text-dhara-green hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register